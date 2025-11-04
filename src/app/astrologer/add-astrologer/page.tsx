'use client';
import React, { useState } from 'react';
import { Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import AstrologerForm from '@/components/AstrologerForm';


export default function AddAstrologerPage() {
  const [snack, setSnack] = useState({ open: false, message: '' });

  return (
    <>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        message={snack.message}
      />

      <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h5" gutterBottom>
          Add Astrologer
        </Typography>
        <AstrologerForm mode="Add" onSnack={setSnack} />
      </Box>
    </>
  );
}