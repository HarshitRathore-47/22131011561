import React, { useEffect, useState } from 'react';
import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
} from '@mui/material';

const API_BASE = 'http://localhost:3000';

export default function UrlStatistics() {
    const [allStats, setAllStats] = useState([]);
    const [loadingAllStats, setLoadingAllStats] = useState(false);
    const [statsError, setStatsError] = useState(null);

    useEffect(() => {
        fetchAllStats();
    }, []);

    async function fetchAllStats() {
        setLoadingAllStats(true);
        setStatsError(null);

        try {
            const codes = JSON.parse(localStorage.getItem('shortcodes') || '[]');

            const results = await Promise.all(
                codes.map(async (code) => {
                    try {
                        const res = await fetch(`${API_BASE}/shorturls/${code}`);
                        if (!res.ok) throw new Error();
                        const data = await res.json();
                        return { ...data, shortcode: code };
                    } catch {
                        return null; // ignore invalid shortcode
                    }
                })
            );

            const validStats = results.filter(Boolean);

            // OPTIONAL: Update localStorage with only valid shortcodes
            const validCodes = validStats.map(s => s.shortcode);
            localStorage.setItem('shortcodes', JSON.stringify(validCodes));

            validStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllStats(validStats);
        } catch {
            setStatsError('Network error fetching statistics.');
        } finally {
            setLoadingAllStats(false);
        }
    }


    return (
        <>
            <Typography variant="h6" component="h2" gutterBottom>
                List of Shortened URLs & Statistics
            </Typography>
            {loadingAllStats && (
                <Typography variant="body1" color="textSecondary" aria-live="polite">
                    Loading statistics...
                </Typography>
            )}
            {statsError && (
                <Alert severity="error" sx={{ mb: 2 }} role="alert">
                    {statsError}
                </Alert>
            )}
            {!loadingAllStats && allStats.length === 0 && !statsError && (
                <Typography>No shortened URLs found.</Typography>
            )}
            {!loadingAllStats && allStats.length > 0 && (
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader aria-label="shortened URLs statistics table" size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Short URL</TableCell>
                                <TableCell>Original URL</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Expiry</TableCell>
                                <TableCell align="center">Total Clicks</TableCell>
                                <TableCell>Click Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allStats.map((item) => (
                                <TableRow key={item.shortcode}>
                                    <TableCell>
                                        <a
                                            href={item.shortlink || `${API_BASE}/${item.shortcode}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.shortlink || `${API_BASE}/${item.shortcode}`}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <a href={item.originalUrl} target="_blank" rel="noopener noreferrer">
                                            {item.originalUrl}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        {item.createdAt
                                            ? new Date(item.createdAt).toLocaleString()
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {item.expiry ? new Date(item.expiry).toLocaleString() : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">{item.totalClicks ?? 0}</TableCell>
                                    <TableCell>
                                        {item.clicks && item.clicks.length > 0 ? (
                                            <Table size="small" aria-label={`Clicks for ${item.shortcode}`}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Timestamp</TableCell>
                                                        <TableCell>Referrer</TableCell>
                                                        <TableCell>Geolocation</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {item.clicks.map((click, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                {click.time
                                                                    ? new Date(click.time).toLocaleString()
                                                                    : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>{click.referrer || 'N/A'}</TableCell>
                                                            <TableCell>{click.geo || 'N/A'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">
                                                No clicks recorded.
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );
}