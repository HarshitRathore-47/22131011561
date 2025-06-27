import React, { useState } from 'react';
import {
    Grid,
    Paper,
    Typography,
    TextField,
    Box,
    Button,
    Alert,
} from '@mui/material';
import { validateUrlInput } from '../utils/validation';

const API_BASE = 'http://localhost:3000';
const DEFAULT_URL_INPUT = { url: '', validity: '', shortcode: '' };

export default function UrlShortenerForm() {
    const [urlInputs, setUrlInputs] = useState(
        Array(5).fill(null).map(() => ({ ...DEFAULT_URL_INPUT }))
    );
    const [creationErrors, setCreationErrors] = useState(Array(5).fill(null));
    const [results, setResults] = useState(Array(5).fill(null));
    const [generalCreationError, setGeneralCreationError] = useState('');

    function handleUrlInputChange(index, field, value) {
        const newInputs = [...urlInputs];
        newInputs[index] = { ...newInputs[index], [field]: value };
        setUrlInputs(newInputs);

        // Clear error for that field on change
        const newErrors = [...creationErrors];
        if (newErrors[index]) {
            newErrors[index] = { ...newErrors[index], [field]: null };
            if (
                newErrors[index] &&
                !newErrors[index].url &&
                !newErrors[index].validity &&
                !newErrors[index].shortcode
            ) {
                newErrors[index] = null;
            }
            setCreationErrors(newErrors);
        }
    }

    function validateAllInputs() {
        const errors = urlInputs.map((input) => validateUrlInput(input));
        setCreationErrors(errors);
        return errors.every((e) => e === null);
    }

    async function createShortUrls() {
        setResults(Array(5).fill(null));
        setGeneralCreationError('');

        if (!validateAllInputs()) {
            return;
        }

        const toProcess = urlInputs.filter((input) => input.url.trim() !== '');
        if (toProcess.length === 0) {
            setGeneralCreationError('Please enter at least one URL to shorten.');
            return;
        }

        try {
            const promises = toProcess.map((input) => {
                const payload = { url: input.url.trim() };
                if (input.validity) payload.validity = Number(input.validity);
                if (input.shortcode) payload.shortcode = input.shortcode.trim();
                return fetch(`${API_BASE}/shorturls`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).then(async (res) => {
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.error || 'Failed to create short URL');
                    return body;
                });
            });

            const responses = await Promise.allSettled(promises);

            const newResults = Array(5).fill(null);
            let rIndex = 0;
            for (let i = 0; i < 5; i++) {
                if (urlInputs[i].url.trim() === '') {
                    newResults[i] = null;
                } else {
                    const res = responses[rIndex];
                    if (res.status === 'fulfilled') {
                        const shortcode = res.value.shortlink.split('/').pop();
                        const stored = JSON.parse(localStorage.getItem('shortcodes') || '[]');
                        const updated = [...new Set([...stored, shortcode])];
                        localStorage.setItem('shortcodes', JSON.stringify(updated));
                        newResults[i] = {
                            shortlink: res.value.shortlink,
                            expiry: res.value.expiry,
                            originalUrl: urlInputs[i].url.trim(),
                        };
                    } else {
                        const newErrors = [...creationErrors];
                        newErrors[i] = { url: res.reason.message || 'Backend error' };
                        setCreationErrors(newErrors);
                        newResults[i] = null;
                    }
                    rIndex++;
                }
            }
            setResults(newResults);
        } catch {
            setGeneralCreationError('Network or server error occurred.');
        }
    }

    return (
        <>
            <Typography variant="h6" component="h2" gutterBottom>
                Shorten up to 5 URLs concurrently
            </Typography>
            <Typography
                variant="body2"
                mb={3}
                sx={{ color: 'text.secondary' }}
                aria-live="polite"
            >
                Provide the original long URL, optional validity in minutes (default 30), and optional shortcode (4-10 chars alphanumeric).
            </Typography>
            <Grid container spacing={3} component="form" noValidate>
                {urlInputs.map((input, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" component="h3" gutterBottom>
                                URL #{idx + 1}
                            </Typography>
                            <TextField
                                label="Long URL"
                                fullWidth
                                required
                                variant="outlined"
                                value={input.url}
                                onChange={(e) => handleUrlInputChange(idx, 'url', e.target.value)}
                                error={!!creationErrors[idx]?.url}
                                helperText={creationErrors[idx]?.url || ''}
                                aria-describedby={`url-error-${idx}`}
                                spellCheck={false}
                                inputProps={{ 'aria-required': true }}
                                margin="dense"
                            />
                            <TextField
                                label="Validity (minutes)"
                                type="number"
                                inputProps={{ min: 1 }}
                                fullWidth
                                variant="outlined"
                                value={input.validity}
                                onChange={(e) => handleUrlInputChange(idx, 'validity', e.target.value)}
                                error={!!creationErrors[idx]?.validity}
                                helperText={
                                    creationErrors[idx]?.validity || 'Defaults to 30 minutes if empty'
                                }
                                margin="dense"
                                aria-describedby={`validity-error-${idx}`}
                            />
                            <TextField
                                label="Custom Shortcode (4-10 alphanumeric chars)"
                                fullWidth
                                variant="outlined"
                                value={input.shortcode}
                                onChange={(e) => handleUrlInputChange(idx, 'shortcode', e.target.value)}
                                error={!!creationErrors[idx]?.shortcode}
                                helperText={creationErrors[idx]?.shortcode || 'Optional'}
                                inputProps={{ maxLength: 10, spellCheck: 'false' }}
                                margin="dense"
                                aria-describedby={`shortcode-error-${idx}`}
                            />
                            {results[idx] && (
                                <Box
                                    mt={2}
                                    role="region"
                                    aria-live="polite"
                                    aria-atomic="true"
                                    tabIndex={-1}
                                >
                                    <Typography variant="body2" gutterBottom>
                                        Short URL:&nbsp;
                                        <a
                                            href={results[idx].shortlink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={0}
                                        >
                                            {results[idx].shortlink}
                                        </a>
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Expires at: {new Date(results[idx].expiry).toLocaleString()}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            {generalCreationError && (
                <Alert severity="error" sx={{ mt: 2 }} role="alert">
                    {generalCreationError}
                </Alert>
            )}
            <Box mt={3} textAlign="center">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={createShortUrls}
                    aria-label="Create Short URLs"
                    size="large"
                >
                    Create Short URLs
                </Button>
            </Box>
        </>
    );
}