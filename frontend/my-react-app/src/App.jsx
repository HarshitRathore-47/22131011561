import React, { useState } from 'react';
import { Container, Typography, Tabs, Tab, Box } from '@mui/material';
import UrlShortenerForm from './components/UrlShortenerForm';
import UrlStatistics from './components/UrlStatistics';

export default function App() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newIndex) => setTabIndex(newIndex);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" tabIndex={0}>
        URL Shortener Microservice
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="URL shortener application tabs"
        centered
        sx={{ mb: 4 }}
      >
        <Tab label="Shorten URLs" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="URL Statistics" id="tab-1" aria-controls="tabpanel-1" />
      </Tabs>

      <Box
        role="tabpanel"
        id={`tabpanel-${tabIndex}`}
        aria-labelledby={`tab-${tabIndex}`}
        tabIndex={0}
      >
        {tabIndex === 0 && <UrlShortenerForm />}
        {tabIndex === 1 && <UrlStatistics />}
      </Box>
    </Container>
  );
}