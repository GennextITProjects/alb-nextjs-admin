// app/astrologer/view-astrologer/components/profile.tsx
import React from "react";
import { CardContent, CardMedia, Typography, Grid, Divider, Box } from "@mui/material";

import moment from "moment";
import { IndianRupee } from "@/utils/common-function";
import { base_url } from "@/lib/api-routes";

// Types
interface Astrologer {
  _id: string;
  astrologerName: string;
  profileImage: string;
  email: string;
  phoneNumber: string;
  wallet_balance: number;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  dateOfBirth: string;
  chat_price: number;
  call_price: number;
  video_call_price: number;
  experience: number;
  about: string;
  short_bio: string;
  long_bio: string;
  rating: number;
  skill: Array<{ skill: string }>;
  remedies: Array<{ title: string; description: string }>;
  mainExpertise: Array<{ mainExpertise: string }>;
  account_holder_name: string;
  account_number: string;
  account_type: string;
  account_name: string;
  IFSC_code: string;
  panCard: string;
  aadharNumber: string;
  chat_status: string;
  call_status: string;
  video_call_status: string;
  alternateNumber: string;
  gender: string;
  currency: string;
  free_min: number;
  avg_rating: number;
  youtubeLink: string;
  follower_count: number;
  address: string;
  country_phone_code: string;
  commission_video_call_price: number;
  normal_video_call_price: number;
  commission_normal_video_call_price: number;
  consultation_price: number;
  commission_call_price: number;
  commission_chat_price: number;
  commission_remark: string;
  expertise: string;
  live_notification: boolean;
  chat_notification: boolean;
  call_notification: boolean;
  workingOnOtherApps: boolean;
  activeBankAcount: boolean;
  isVerified: boolean;
  isOnline: boolean;
  today_earnings: number;
}

interface ProfileProps {
  astrologer: Astrologer;
}

const Profile: React.FC<ProfileProps> = ({ astrologer }) => {
  const {
    astrologerName,
    phoneNumber,
    alternateNumber,
    gender,
    email,
    profileImage,
    chat_price,
    call_price,
    video_call_price,
    experience,
    about,
    city,
    state,
    country,
    zipCode,
    free_min,
    rating,
    skill,
    remedies,
    mainExpertise,
    youtubeLink,
    short_bio,
    long_bio,
    follower_count,
    aadharNumber,
    dateOfBirth,
    address,
    commission_video_call_price,
    normal_video_call_price,
    commission_normal_video_call_price,
    consultation_price,
    commission_call_price,
    commission_chat_price,
    expertise,
    account_holder_name,
    account_number,
    account_type,
    account_name,
    IFSC_code,
    panCard,
    chat_status,
    call_status,
    video_call_status,
    wallet_balance,
  } = astrologer;

  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#fff", 
      marginBottom: "20px", 
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', 
      borderRadius: "15px" 
    }}>
      <Grid container spacing={4}>
        {/* Profile Section */}
        <Grid item xs={12} sm={4}>
          <CardMedia
            component="img"
            height="250"
            image={`${base_url}${profileImage}`}
            alt={astrologerName}
            style={{ borderRadius: "10px", border: "1px solid #e0e0e0" }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {astrologerName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {short_bio}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1">
              <strong>Experience: </strong> {experience} years
            </Typography>
            <Typography variant="body1">
              <strong>Location: </strong> {city}, {state}, {country} - {zipCode}
            </Typography>
            <Typography variant="body1">
              <strong>Phone: </strong> {phoneNumber} | Alt: {alternateNumber || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Email: </strong> {email}
            </Typography>
            <Typography variant="body1">
              <strong>Gender: </strong> {gender}
            </Typography>
            <Typography variant="body1">
              <strong>Date of Birth: </strong> {moment(dateOfBirth).format('DD MMM YYYY')}
            </Typography>
            <Typography variant="body1">
              <strong>Rating: </strong> {rating?.toFixed(1)}
            </Typography>
          </CardContent>
        </Grid>

        {/* About Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h5" gutterBottom>
            About
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'justify' }}>
            {long_bio || about || 'No description available.'}
          </Typography>
        </Grid>

        {/* Pricing Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h5" gutterBottom>
            Consultation Price
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Chat Price:</strong> {IndianRupee(chat_price)}</Typography>
              <Typography variant="body1"><strong>Call Price:</strong> {IndianRupee(call_price)}</Typography>
              <Typography variant="body1"><strong>Video Call Price:</strong> {IndianRupee(normal_video_call_price)}</Typography>
              <Typography variant="body1"><strong>Live Price:</strong> {IndianRupee(video_call_price)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Chat Platform Charge:</strong> {IndianRupee(commission_chat_price)}</Typography>
              <Typography variant="body1"><strong>Call Platform Charge:</strong> {IndianRupee(commission_call_price)}</Typography>
              <Typography variant="body1"><strong>Video Call Platform Charge:</strong> {IndianRupee(commission_normal_video_call_price)}</Typography>
              <Typography variant="body1"><strong>Live Platform Charge:</strong> {IndianRupee(commission_video_call_price)}</Typography>
            </Grid>
          </Grid>
        </Grid>

        {/* Skills Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Skills</Typography>
          <Grid container spacing={2}>
            {skill?.map((value, index) => (
              <Grid item key={index}>
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px 16px', 
                  borderRadius: '20px',
                  border: '1px solid #e0e0e0'
                }}>
                  {value?.skill?.trim()}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Remedies Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Remedies</Typography>
          <Grid container spacing={3}>
            {remedies?.map((value, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                    {value?.title?.trim()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {value?.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Main Expertise Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Main Expertise</Typography>
          <Grid container spacing={2}>
            {mainExpertise?.map((value, index) => (
              <Grid item key={index}>
                <Box sx={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '8px 16px', 
                  borderRadius: '20px',
                  border: '1px solid #bbdefb'
                }}>
                  {value?.mainExpertise?.trim()}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Bank Information Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h5" gutterBottom>
            Bank Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Account Holder:</strong> {account_holder_name || 'N/A'}</Typography>
              <Typography variant="body1"><strong>Account Number:</strong> {account_number || 'N/A'}</Typography>
              <Typography variant="body1"><strong>Account Type:</strong> <span style={{ textTransform: 'capitalize' }}>{account_type || 'N/A'}</span></Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Bank Name:</strong> {account_name || 'N/A'}</Typography>
              <Typography variant="body1"><strong>IFSC Code:</strong> {IFSC_code || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Grid>

        {/* Additional Information Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h5" gutterBottom>
            Additional Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Pan Card:</strong> {panCard || 'N/A'}</Typography>
              <Typography variant="body1"><strong>Aadhar Card:</strong> {aadharNumber || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Chat Status:</strong> {chat_status || 'N/A'}</Typography>
              <Typography variant="body1"><strong>Call Status:</strong> {call_status || 'N/A'}</Typography>
              <Typography variant="body1"><strong>Video Call Status:</strong> {video_call_status || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Profile;