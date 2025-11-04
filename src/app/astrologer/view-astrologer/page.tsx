// app/astrologer/view-astrologer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Box, Grid, Tab, Tabs } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import moment from 'moment';
import { base_url, get_astrologer_by_id, get_astrologer_duration_by_id } from '@/lib/api-routes';
import { IndianRupee } from '@/utils/common-function';
import Profile from '@/components/view-astrologer/Profile';
import ChatHistory from '@/components/view-astrologer/Chat-history';
import CallHistory from '@/components/view-astrologer/CallHistory';
import VideoCallHistory from '@/components/view-astrologer/VedioCallHistory';
import LiveHistory from '@/components/view-astrologer/LiveHistory';
import GiftHistory from '@/components/view-astrologer/GiftHistory';
import Review from '@/components/view-astrologer/Review';


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

interface DurationData {
  totalActiveDuration: number;
  totalOfflineDuration: number;
}

export default function ViewAstrologer() {
  const router = useRouter();
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
  const [durationData, setDurationData] = useState<DurationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [astrologerId, setAstrologerId] = useState<string>('');

  const tabHead = ['Profile', 'Chat', 'Call', 'Video Call', 'Live', 'Gift', 'Review'];
  const [activeTabHead, setActiveTabHead] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => setActiveTabHead(newValue);

  // Get astrologer data from sessionStorage or localStorage
  useEffect(() => {
    const getAstrologerData = () => {
      // Try to get from sessionStorage first (common pattern for state passing in Next.js)
      const stateData = sessionStorage.getItem('selectedAstrologer');
      
      if (stateData) {
        try {
          const parsedData = JSON.parse(stateData);
          setAstrologerId(parsedData._id);
          setAstrologer(parsedData); // Set initial data from state
        } catch (error) {
          console.error('Error parsing astrologer data:', error);
        }
      } else {
        // If no state data, redirect back
        router.back();
      }
    };

    getAstrologerData();
  }, [router]);

  // Fetch detailed astrologer data and duration
  useEffect(() => {
    const fetchAstrologerDetails = async () => {
      if (!astrologerId) return;

      try {
        setIsLoading(true);
        
        // Fetch detailed astrologer data
        const astroResponse = await fetch(`${base_url}${get_astrologer_by_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            astrologerId: astrologerId
          })
        });

        if (astroResponse.ok) {
          const astroData = await astroResponse.json();
          setAstrologer(astroData.results
 || astroData);
        }

        // Fetch duration data
        const durationResponse = await fetch(`${base_url}${get_astrologer_duration_by_id(astrologerId)}`);
        if (durationResponse.ok) {
          const durationData = await durationResponse.json();
          setDurationData(durationData);
        }
      } catch (error) {
        console.error('Error fetching astrologer details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (astrologerId) {
      fetchAstrologerDetails();
    }
  }, [astrologerId]);

  const timeFormat = (seconds: number) => {
    const duration = moment.duration(seconds, 'seconds');
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const secs = duration.seconds();

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!astrologer) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Astrologer not found</div>;
  }

  const {
    astrologerName,
    profileImage,
    email,
    phoneNumber,
    wallet_balance,
    city,
    state,
    country,
    zipCode,
    dateOfBirth,
  } = astrologer;

  return (
    <>
      <div onClick={() => router.back()} style={{ marginBottom: "20px", cursor: 'pointer' }}>
        <ArrowBack />
      </div>

      <div style={{ 
        padding: "20px", 
        backgroundColor: "#fff", 
        marginBottom: "20px", 
        boxShadow: '0px 0px 5px lightgrey', 
        borderRadius: "10px" 
      }}>
        <Grid container spacing={2} rowGap={5} sx={{ alignItems: 'center', padding: "20px 30px" }}>
          <Grid item xs={12} md={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Avatar 
                src={base_url + profileImage} 
                style={{ width: 100, height: 100, borderRadius: "50%", border: '1px solid #ccc' }} 
                variant="rounded" 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{astrologerName}</div>
                <div>{phoneNumber}</div>
              </div>
            </div>
          </Grid>

          <Grid item xs={12} md={4}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px', 
              borderLeft: '1px solid #ccc', 
              paddingLeft: "20px" 
            }}>
              <div style={{ fontWeight: "bold", fontSize: '18px' }}>Contact Details</div>
              <div>{email}</div>
              <div>{city}, {state}, {country} - {zipCode}</div>
              <div>Wallet : {IndianRupee(wallet_balance)}</div>
            </div>
          </Grid>

          <Grid item xs={12} md={4}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px', 
              borderLeft: '1px solid #ccc', 
              paddingLeft: "20px" 
            }}>
              <div style={{ fontWeight: "bold", fontSize: '18px' }}>Details</div>
              <div>Birth Date : {moment(dateOfBirth).format('DD MMM YYYY')}</div>
              <div>Active Duration : {durationData ? timeFormat(durationData.totalActiveDuration / 1000) : '00:00:00'}</div>
              <div>Offline Duration : {durationData ? timeFormat(durationData.totalOfflineDuration / 1000) : '00:00:00'}</div>
            </div>
          </Grid>
        </Grid>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: "20px 0" }}>
        <Box sx={{ 
          width: '100%', 
          flexGrow: 1, 
          bgcolor: 'background.paper', 
          maxWidth: { xs: '85vw', md: 'calc(100vw - 300px)' }, 
          alignSelf: 'center' 
        }}>
          <Tabs 
            value={activeTabHead} 
            onChange={handleChange} 
            variant="scrollable" 
            scrollButtons={true} 
            sx={{ gap: "50px" }}
          >
            {tabHead?.map((value, index) => (
              <Tab key={index} label={value} />
            ))}
          </Tabs>
        </Box>
      </div>

      <div style={{ padding: "20px 0" }}>
        {activeTabHead === 0 && <div><Profile astrologer={astrologer} /></div>}
        {activeTabHead === 1 && <div><ChatHistory astrologerId={astrologerId} /></div>}
        {activeTabHead === 2 && <div><CallHistory astrologerId={astrologerId} /></div>}
        {activeTabHead === 3 && <div><VideoCallHistory astrologerId={astrologerId} /></div>}
        {activeTabHead === 4 && <div><LiveHistory astrologerId={astrologerId} /></div>}
        {activeTabHead === 5 && <div><GiftHistory astrologerId={astrologerId} /></div>}
        {activeTabHead === 6 && <div><Review astrologerId={astrologerId} /></div>}
      </div>
    </>
  );
}