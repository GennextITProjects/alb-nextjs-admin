// components/modal/ViewModal.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

interface ViewModalProps {
  open: boolean;
  text: string;
  title: string;
  onClose: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ open, text, title, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ padding: '10px 0' }}>
          <Typography variant="body1">
            {text || 'No content available.'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewModal;