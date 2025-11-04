'use client';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormLabel,
  Button,
  Avatar,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Country, State, City } from 'country-state-city';
import { Color } from '@/assets/colors';
import { calculateAge, get_date_value } from '@/utils/common-function';
import {
  api_url,
  base_url,
  get_skill,
  get_main_expertise,
  get_remedies,
  get_language,
  get_slot_duration,
  create_astrologer,
  update_astrologer_by_id,
} from '@/lib/api-routes';
import Swal from 'sweetalert2';
import { CrossSvg, UploadImageSvg, DeleteSvg } from '@/components/svgs/page';

interface Skill { _id: string; skill: string }
interface Expertise { _id: string; mainExpertise: string }
interface Remedy { _id: string; title: string }
interface Language { _id: string; languageName: string }
interface SlotDuration { _id: string; slotDuration: string; active: boolean }
interface ConsultationPrice {
  _id?: string;
  duration: SlotDuration;
  price: number;
}

/* ────────────────────── FORM STATE (API‑exact) ────────────────────── */
interface AstrologerFormData {
  astrologerName: string;
  displayName: string;
  title: string;
  phoneNumber: string;
  alternateNumber: string;
  country_phone_code: string;
  email: string;
  password: string;
  confirm_password: string;
  gender: string;
  dateOfBirth: string;
  experience: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  youtubeLink: string;
  free_min: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  IFSC_code: string;
  account_holder_name: string;
  panCard: string;
  aadharNumber: string;
  consultation_price: string;
  call_price: string;
  commission_call_price: string;
  totalCallDuration: number;
  chat_price: string;
  commission_chat_price: string;
  totalChatDuration: number;
  normal_video_call_price: number;
  commission_normal_video_call_price: number;
  totalVideoCallDuration: number;
  video_call_price: number;
  commission_video_call_price: number;
  gift_commission: number;
  consultation_commission_call: string;
  consultation_call_price: string;
  consultation_commission_chat: string;
  consultation_chat_price: string;
  consultation_commission_videocall: string;
  consultation_videocall_price: string;
  consultation_commission: string;
  short_bio: string;
  about: string;
  tagLine: string;
  commission_remark: string;
  workingOnOtherApps: string;
  long_bio: string;
}

/* ────────────────────── PROPS ────────────────────── */
interface Props {
  mode: 'Add' | 'Edit';
  initialData?: any;
  onSnack: (snack: { open: boolean; message: string }) => void;
}

/* ────────────────────── MAIN COMPONENT ────────────────────── */
export default function AstrologerForm({ mode, initialData, onSnack }: Props) {
  const isEdit = mode === 'Edit';

  /* ────── INITIAL FORM STATE ────── */
  const [form, setForm] = useState<AstrologerFormData>({
    astrologerName: initialData?.astrologerName || '',
    displayName: initialData?.displayName || '',
    title: initialData?.title || '',
    phoneNumber: initialData?.phoneNumber || '',
    alternateNumber: initialData?.alternateNumber || '',
    country_phone_code: initialData?.country_phone_code || '91',
    email: initialData?.email || '',
    password: '',
    confirm_password: '',
    gender: initialData?.gender || '',
    dateOfBirth: initialData?.dateOfBirth ? moment(initialData.dateOfBirth).format('YYYY-MM-DD') : '',
    experience: initialData?.experience || '',
    address: initialData?.address || '',
    country: initialData?.country || 'India',
    state: initialData?.state || '',
    city: initialData?.city || '',
    zipCode: initialData?.zipCode || '',
    youtubeLink: initialData?.youtubeLink || 'https://www.youtube.com/',
    free_min: initialData?.free_min?.toString() || '5',
    bank_name: initialData?.account_name || '',
    account_number: initialData?.account_number || '',
    account_type: initialData?.account_type || '',
    IFSC_code: initialData?.IFSC_code || '',
    account_holder_name: initialData?.account_holder_name || '',
    panCard: initialData?.panCard || '',
    aadharNumber: initialData?.aadharNumber || '',
    consultation_price: initialData?.consultation_price || '4',
    call_price: initialData?.call_price || '',
    commission_call_price: initialData?.commission_call_price || '',
    totalCallDuration: initialData?.totalCallDuration ? initialData.totalCallDuration / 60 : 0,
    chat_price: initialData?.chat_price || '',
    commission_chat_price: initialData?.commission_chat_price || '',
    totalChatDuration: initialData?.totalChatDuration ? initialData.totalChatDuration / 60 : 0,
    normal_video_call_price: initialData?.normal_video_call_price || 0,
    commission_normal_video_call_price: initialData?.commission_normal_video_call_price || 0,
    totalVideoCallDuration: initialData?.totalVideoCallDuration ? initialData.totalVideoCallDuration / 60 : 0,
    video_call_price: initialData?.video_call_price || 0,
    commission_video_call_price: initialData?.commission_video_call_price || 0,
    gift_commission: initialData?.gift_commission || 0,
    consultation_commission_call: initialData?.consultation_commission_call || '',
    consultation_call_price: initialData?.consultation_call_price || '',
    consultation_commission_chat: initialData?.consultation_commission_chat || '',
    consultation_chat_price: initialData?.consultation_chat_price || '',
    consultation_commission_videocall: initialData?.consultation_commission_videocall || '',
    consultation_videocall_price: initialData?.consultation_videocall_price || '',
    consultation_commission: initialData?.consultation_commission || '',
    short_bio: initialData?.short_bio || '',
    about: initialData?.about || '',
    tagLine: initialData?.tagLine || '',
    commission_remark: initialData?.commission_remark || '',
    workingOnOtherApps: initialData?.workingOnOtherApps || 'No',
    long_bio: initialData?.long_bio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [mainExpertise, setMainExpertise] = useState<Expertise[]>([]);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [slotDurations, setSlotDurations] = useState<SlotDuration[]>([]);
  const [consultationPrices, setConsultationPrices] = useState<ConsultationPrice[]>([]);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skill?.map((s: any) => s._id) || []
  );
  const [selectedRemedies, setSelectedRemedies] = useState<string[]>(
    initialData?.remedies?.map((r: any) => r._id) || []
  );
  const [selectedMainExpertise, setSelectedMainExpertise] = useState<string[]>(
    initialData?.mainExpertise?.map((e: any) => e._id) || []
  );

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialData?.language?.map((l: any) => l.languageName) || []
  );

  const [image, setImage] = useState<{ file: string; bytes: File | null }>({
    file: initialData?.profileImage ? `${api_url}${initialData.profileImage}` : '',
    bytes: null,
  });
  const [bankProof, setBankProof] = useState<{ file: string; bytes: File | null }>({
    file: initialData?.bank_proof_image ? `${api_url}${initialData.bank_proof_image}` : '',
    bytes: null,
  });
  const [idProof, setIdProof] = useState<{ file: string; bytes: File | null }>({
    file: initialData?.id_proof_image ? `${api_url}${initialData.id_proof_image}` : '',
    bytes: null,
  });
  const [bulkImages, setBulkImages] = useState<{ file: string; bytes: File | null }[]>(
    initialData?.multipleImages?.map((img: string) => ({ file: `${api_url}${img}`, bytes: null })) || []
  );
  const [bulkVideos, setBulkVideos] = useState<{ file: string; bytes: File | null }[]>(
    initialData?.multipleVideos?.map((vid: string) => ({ file: `${api_url}${vid}`, bytes: null })) || []
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>({ name: 'India', isoCode: 'IN' });
  const [selectedState, setSelectedState] = useState<any>({});

  /* ────── FETCH LOOKUPS ────── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          skillsRes,
          expertiseRes,
          remediesRes,
          languagesRes,
          slotsRes,
        ] = await Promise.all([
          fetch(`${base_url}${get_skill}`),
          fetch(`${base_url}${get_main_expertise}`),
          fetch(`${base_url}${get_remedies}`),
          fetch(`${api_url}${get_language}`),
          fetch(`${base_url}${get_slot_duration}`),
        ]);

        if (!skillsRes.ok || !expertiseRes.ok || !remediesRes.ok || !languagesRes.ok || !slotsRes.ok) {
          throw new Error('Failed to fetch lookup data');
        }

        const [skillsData, expertiseData, remediesData, languagesData, slotsData] = await Promise.all([
          skillsRes.json(),
          expertiseRes.json(),
          remediesRes.json(),
          languagesRes.json(),
          slotsRes.json(),
        ]);

        setSkills(skillsData?.skills || []);
        setMainExpertise(expertiseData?.mainExpertise || []);
        setRemedies(remediesData?.remedies || []);
        setLanguages(languagesData?.languageData || []);
        setSlotDurations(slotsData?.slots || []);

        if (isEdit && initialData?._id) {
          const cpRes = await fetch(`${base_url}api/admin/get_consultation_price?astrologerId=${initialData._id}`);
          if (cpRes.ok) {
            const cpData = await cpRes.json();
            setConsultationPrices(cpData?.data || []);
          }
        }
      } catch (err) {
        onSnack({ open: true, message: 'Failed to load lookup data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEdit, initialData?._id, onSnack]);

  /* ────── HANDLERS ────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleMultiSelectChange = (e: SelectChangeEvent<string[]>) => {
    const { name, value } = e.target;
    if (name === 'language') setSelectedLanguages(value as string[]);
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < 500 * 1024) {
      setImage({ file: URL.createObjectURL(file), bytes: file });
    } else if (file) {
      onSnack({ open: true, message: 'Profile image must be < 500KB' });
    }
  };

  const handleBulk = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'video' && file.size > 30 * 1024 * 1024) {
      onSnack({ open: true, message: 'Video must be < 30MB' });
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === 'image') setBulkImages(prev => [...prev, { file: url, bytes: file }]);
    else setBulkVideos(prev => [...prev, { file: url, bytes: file }]);
  };

  const removeBulk = (index: number, type: 'image' | 'video') => {
    if (type === 'image') setBulkImages(prev => prev.filter((_, i) => i !== index));
    else setBulkVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckbox = (
    id: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  /* ────── VALIDATION ────── */
  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;

    if (!form.astrologerName) newErrors.astrologerName = 'Name required';
    if (!emailRegex.test(form.email)) newErrors.email = 'Invalid email';
    if (!mobileRegex.test(form.phoneNumber)) newErrors.phoneNumber = '10‑digit mobile required';
    if (!isEdit && !form.password) newErrors.password = 'Password required';
    if (form.password !== form.confirm_password) newErrors.confirm_password = 'Passwords must match';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'DOB required';
    if (calculateAge(form.dateOfBirth) < 18) newErrors.dateOfBirth = 'Must be 18+';
    if (!form.experience) newErrors.experience = 'Experience required';
    if (selectedLanguages.length === 0) newErrors.language = 'Select at least one language';
    if (!image.bytes && !isEdit) newErrors.image = 'Profile image required';
    if (selectedSkills.length === 0) newErrors.skills = 'Select at least one skill';
    if (selectedRemedies.length === 0) newErrors.remedies = 'Select at least one remedy';
    if (selectedMainExpertise.length === 0) newErrors.mainExpertise = 'Select at least one expertise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ────── SUBMIT ────── */
  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();

    // ---- BASIC FIELDS ----
    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach(v => formData.append(`${key}[]`, v));
      else formData.append(key, value);
    });

    // ---- FILES ----
    if (image.bytes) formData.append('profileImage', image.bytes);
    if (bankProof.bytes) formData.append('bank_proof_image', bankProof.bytes);
    if (idProof.bytes) formData.append('id_proof_image', idProof.bytes);
    bulkImages.forEach(img => img.bytes && formData.append('multipleImages', img.bytes));
    bulkVideos.forEach(vid => vid.bytes && formData.append('multipleVideos', vid.bytes));

    // ---- ARRAY FIELDS ----
    selectedSkills.forEach(id => formData.append('skill[]', id));
    selectedRemedies.forEach(id => formData.append('remedies[]', id));
    selectedMainExpertise.forEach(id => formData.append('mainExpertise[]', id));
    selectedLanguages.forEach(lang => formData.append('language[]', lang));

    // ---- CONSULTATION PRICES ----
    consultationPrices.forEach((cp, i) => {
      formData.append(`consultationPrices[${i}][duration]`, cp.duration._id);
      formData.append(`consultationPrices[${i}][price]`, cp.price.toString());
    });

    if (isEdit) formData.append('astrologerId', initialData._id);

    try {
      const endpoint = isEdit ? update_astrologer_by_id : create_astrologer;
      const res = await fetch(`${base_url}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        Swal.fire('Success', result.message || 'Saved!', 'success');
        window.location.href = '/astrologer';
      } else {
        onSnack({ open: true, message: result.message || 'Failed' });
      }
    } catch (err) {
      onSnack({ open: true, message: 'Network error' });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;

  /* ────── RENDER ────── */
  return (
    <Grid container spacing={3}>
      {/* ── PROFILE IMAGE ── */}
      <Grid item xs={12} md={4}>
        <Box sx={{ border: '1px solid #C4C4C4', borderRadius: 1, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}>
              <Avatar src={image.file || '/placeholder-avatar.jpg'} sx={{ width: 54, height: 54, borderRadius: 0, objectFit: 'contain' }} />
            </Grid>
            <Grid item xs={9}>
              <label htmlFor="upload-image" style={{ cursor: 'pointer' }}>
                <Typography variant="caption" color="error">*</Typography> Choose Astrologer Image
                <Typography variant="caption" sx={{ color: 'green', fontSize: '10px' }}>
                  {/* png / jpg / jpeg (< 500KB) */}
                </Typography>
                <input id="upload-image" type="file" accept="image/*" hidden onChange={handleImage} />
              </label>
            </Grid>
          </Grid>
        </Box>
        {errors.image && <Typography color="error" variant="caption">{errors.image}</Typography>}
      </Grid>

      {/* ── BASIC INFO ── */}
      <Grid item xs={12} md={4}>
        <TextField fullWidth label={<>Full Name <span style={{ color: 'red' }}>*</span></>} name="astrologerName" value={form.astrologerName} onChange={handleChange} error={!!errors.astrologerName} helperText={errors.astrologerName} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth label="Display Name" name="displayName" value={form.displayName} onChange={handleChange} />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField fullWidth label={<>Email <span style={{ color: 'red' }}>*</span></>} name="email" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth label={<>Mobile Number <span style={{ color: 'red' }}>*</span></>} name="phoneNumber" value={form.phoneNumber} onChange={handleChange} error={!!errors.phoneNumber} helperText={errors.phoneNumber} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth label="Alternate Mobile" name="alternateNumber" value={form.alternateNumber} onChange={handleChange} />
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Currency *</InputLabel>
          <Select name="currency" value={form.consultation_price ? 'INR' : ''} onChange={handleSelectChange}>
            <MenuItem value="INR">INR</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Gender *</InputLabel>
          <Select name="gender" value={form.gender} onChange={handleSelectChange}>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* ── PASSWORD (ADD ONLY) ── */}
      {!isEdit && (
        <>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={<>Password <span style={{ color: 'red' }}>*</span></>}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={<>Confirm Password <span style={{ color: 'red' }}>*</span></>}
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </>
      )}

      {/* ── DOB & EXPERIENCE ── */}
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label={<>Date of Birth <span style={{ color: 'red' }}>*</span></>}
          type="date"
          name="dateOfBirth"
          value={form.dateOfBirth}
          onChange={handleChange}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: get_date_value(18) }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label={<>Experience (years) <span style={{ color: 'red' }}>*</span></>}
          type="number"
          name="experience"
          value={form.experience}
          onChange={handleChange}
          error={!!errors.experience}
          helperText={errors.experience}
          inputProps={{ min: 0 }}
        />
      </Grid>

      {/* ── LANGUAGES ── */}
      <Grid item xs={12} md={4}>
        <FormControl fullWidth error={!!errors.language}>
          <InputLabel>Select Language *</InputLabel>
          <Select name="language" multiple value={selectedLanguages} onChange={handleMultiSelectChange}>
            {languages.map(l => (
              <MenuItem key={l._id} value={l.languageName}>{l.languageName}</MenuItem>
            ))}
          </Select>
          {errors.language && <Typography color="error" variant="caption">{errors.language}</Typography>}
        </FormControl>
      </Grid>

      {/* ── ADDRESS ── */}
      <Grid item xs={12} md={8}>
        <TextField fullWidth label="Address" name="address" value={form.address} onChange={handleChange} />
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Country *</InputLabel>
          <Select
            name="country"
            value={form.country}
            onChange={(e: SelectChangeEvent<string>) => {
              handleSelectChange(e);
              const country = Country.getAllCountries().find((c: any) => c.name === e.target.value);
              setSelectedCountry(country || { name: 'India', isoCode: 'IN' });
            }}
          >
            {Country.getAllCountries().map((c: any) => (
              <MenuItem key={c.isoCode} value={c.name}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>State *</InputLabel>
          <Select
            name="state"
            value={form.state}
            onChange={(e: SelectChangeEvent<string>) => {
              handleSelectChange(e);
              const state = State.getStatesOfCountry(selectedCountry.isoCode).find((s: any) => s.name === e.target.value);
              setSelectedState(state || {});
            }}
          >
            {State.getStatesOfCountry(selectedCountry.isoCode).map((s: any) => (
              <MenuItem key={s.isoCode} value={s.name}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>City *</InputLabel>
          <Select name="city" value={form.city} onChange={handleSelectChange}>
            {City.getCitiesOfState(selectedState.countryCode || 'IN', selectedState.isoCode || '')?.map((c: any) => (
              <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField fullWidth label="Pin Code" name="zipCode" value={form.zipCode} onChange={handleChange} />
      </Grid>

      {/* ── BANK DETAILS ── */}
      <Grid item xs={12} md={4}>
        <TextField fullWidth label="Bank Name" name="bank_name" value={form.bank_name} onChange={handleChange} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth label={<>Account Number <span style={{ color: 'red' }}>*</span></>} name="account_number" value={form.account_number} onChange={handleChange} />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Account Type</InputLabel>
          <Select name="account_type" value={form.account_type} onChange={handleSelectChange}>
            <MenuItem value="saving">Saving</MenuItem>
            <MenuItem value="current">Current</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField fullWidth label="Account Holder Name" name="account_holder_name" value={form.account_holder_name} onChange={handleChange} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth label="IFSC Code" name="IFSC_code" value={form.IFSC_code} onChange={handleChange} />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField fullWidth label={<>Aadhar Number <span style={{ color: 'red' }}>*</span></>} name="aadharNumber" value={form.aadharNumber} onChange={handleChange} />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField fullWidth label={<>PAN Number <span style={{ color: 'red' }}>*</span></>} name="panCard" value={form.panCard} onChange={handleChange} />
      </Grid>

      {/* ── PROOFS ── */}
      <Grid item xs={12} md={6}>
        <Box sx={{ border: '1px solid #C4C4C4', borderRadius: 1, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Avatar src={bankProof.file || '/placeholder-doc.jpg'} sx={{ width: 56, height: 56 }} />
            </Grid>
            <Grid item xs={9}>
              <label htmlFor="upload-bank-proof" style={{ cursor: 'pointer' }}>
                Upload Bank Proof
                <Typography variant="caption" sx={{ color: 'green', fontSize: '10px' }}>
                  png / jpg / jpeg
                </Typography>
                <input id="upload-bank-proof" type="file" accept="image/*" hidden onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setBankProof({ file: URL.createObjectURL(f), bytes: f });
                }} />
              </label>
            </Grid>
          </Grid>
        </Box>
      </Grid>

      <Grid item xs={12} md={6}>
        <Box sx={{ border: '1px solid #C4C4C4', borderRadius: 1, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Avatar src={idProof.file || '/placeholder-doc.jpg'} sx={{ width: 56, height: 56 }} />
            </Grid>
            <Grid item xs={9}>
              <label htmlFor="upload-id-proof" style={{ cursor: 'pointer' }}>
                Upload ID Proof
                <Typography variant="caption" sx={{ color: 'green', fontSize: '10px' }}>
                  png / jpg / jpeg
                </Typography>
                <input id="upload-id-proof" type="file" accept="image/*" hidden onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setIdProof({ file: URL.createObjectURL(f), bytes: f });
                }} />
              </label>
            </Grid>
          </Grid>
        </Box>
      </Grid>

      {/* ── BULK IMAGES / VIDEOS ── */}
      <Grid item xs={12}>
        <Box sx={{ border: bulkImages.length ? `1px solid ${Color.primary}` : '1px solid #C4C4C4', borderRadius: 1, p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {bulkImages.map((img, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <Avatar src={img.file} sx={{ width: 150, height: 150, borderRadius: 0 }} />
                <IconButton size="small" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white' }} onClick={() => removeBulk(i, 'image')}>
                  <CrossSvg />
                </IconButton>
              </Box>
            ))}
          </Box>
          <label htmlFor="upload-bulk-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', backgroundColor: '#F1F1F7', padding: '8px', borderRadius: '4px' }}>
            <UploadImageSvg h="25" w="25" color="#000" />
            <Typography fontWeight={600}>Upload Image</Typography>
          </label>
          <input id="upload-bulk-image" type="file" accept="image/*" hidden onChange={e => handleBulk(e, 'image')} />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ border: bulkVideos.length ? `1px solid ${Color.primary}` : '1px solid #C4C4C4', borderRadius: 1, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {bulkVideos.map((vid, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <video controls style={{ width: 150, height: 150 }}>
                  <source src={vid.file} />
                </video>
                <IconButton size="small" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white' }} onClick={() => removeBulk(i, 'video')}>
                  <CrossSvg />
                </IconButton>
              </Box>
            ))}
          </Box>
          <label htmlFor="upload-bulk-video" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', backgroundColor: '#F1F1F7', padding: '8px', borderRadius: '4px' }}>
            <UploadImageSvg h="25" w="25" color="#000" />
            <Typography fontWeight={600}>Upload Video</Typography>
          </label>
          <input id="upload-bulk-video" type="file" accept="video/*" hidden onChange={e => handleBulk(e, 'video')} />
        </Box>
      </Grid>

      {/* ── CONSULTATION COMMISSION ── */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label={<>Consultation Commission (%) <span style={{ color: 'red' }}>*</span></>}
          name="consultation_commission"
          value={form.consultation_commission}
          onChange={handleChange}
        />
      </Grid>

      {/* ── TAGLINE / BIOS ── */}
      <Grid item xs={12}>
        <TextField fullWidth label="Tag Line" name="tagLine" value={form.tagLine} onChange={handleChange} multiline rows={2} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Short Bio" name="short_bio" value={form.short_bio} onChange={handleChange} multiline rows={2} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="About" name="about" value={form.about} onChange={handleChange} multiline rows={3} />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Long Bio"
          name="long_bio"
          value={form.long_bio}
          onChange={handleChange}
          multiline
          rows={6}
          placeholder="Detailed biography..."
        />
      </Grid>

      {/* ── SKILLS / REMEDIES / EXPERTISE ── */}
      <Grid item xs={12}>
        <FormLabel component="legend">
          Skills <span style={{ color: 'red' }}>*</span>
          {errors.skills && <Typography color="error" variant="caption" sx={{ ml: 1 }}>{errors.skills}</Typography>}
        </FormLabel>
        <FormGroup row>
          {skills.sort((a, b) => a.skill.localeCompare(b.skill)).map(s => (
            <FormControlLabel
              key={s._id}
              control={<Checkbox checked={selectedSkills.includes(s._id)} onChange={() => handleCheckbox(s._id, selectedSkills, setSelectedSkills)} />}
              label={s.skill}
            />
          ))}
        </FormGroup>
      </Grid>

      <Grid item xs={12}>
        <FormLabel component="legend">
          Remedies <span style={{ color: 'red' }}>*</span>
          {errors.remedies && <Typography color="error" variant="caption" sx={{ ml: 1 }}>{errors.remedies}</Typography>}
        </FormLabel>
        <FormGroup row>
          {remedies.sort((a, b) => a.title.localeCompare(b.title)).map(r => (
            <FormControlLabel
              key={r._id}
              control={<Checkbox checked={selectedRemedies.includes(r._id)} onChange={() => handleCheckbox(r._id, selectedRemedies, setSelectedRemedies)} />}
              label={r.title}
            />
          ))}
        </FormGroup>
      </Grid>

      <Grid item xs={12}>
        <FormLabel component="legend">
          Main Expertise <span style={{ color: 'red' }}>*</span>
          {errors.mainExpertise && <Typography color="error" variant="caption" sx={{ ml: 1 }}>{errors.mainExpertise}</Typography>}
        </FormLabel>
        <FormGroup row>
          {mainExpertise.sort((a, b) => a.mainExpertise.localeCompare(b.mainExpertise)).map(e => (
            <FormControlLabel
              key={e._id}
              control={<Checkbox checked={selectedMainExpertise.includes(e._id)} onChange={() => handleCheckbox(e._id, selectedMainExpertise, setSelectedMainExpertise)} />}
              label={e.mainExpertise}
            />
          ))}
        </FormGroup>
      </Grid>

      {/* ── SUBMIT ── */}
      <Grid item xs={12}>
        <Button variant="contained" sx={{ bgcolor: Color.primary, color: '#fff' }} onClick={handleSubmit}>
          {isEdit ? 'Update' : 'Submit'}
        </Button>
      </Grid>

      {/* ── CONSULTATION PRICES (EDIT ONLY) ── */}
      {isEdit && (
        <ConsultationPriceSection
          astrologerId={initialData._id}
          slotDurations={slotDurations}
          consultationPrices={consultationPrices}
          setConsultationPrices={setConsultationPrices}
        />
      )}
    </Grid>
  );
}

/* ────────────────────── CONSULTATION PRICE SECTION ────────────────────── */
const ConsultationPriceSection = ({
  astrologerId,
  slotDurations,
  consultationPrices,
  setConsultationPrices,
}: {
  astrologerId: string;
  slotDurations: SlotDuration[];
  consultationPrices: ConsultationPrice[];
  setConsultationPrices: React.Dispatch<React.SetStateAction<ConsultationPrice[]>>;
}) => {
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');

  const handleAdd = () => {
    if (!duration || !price) return;
    const newPrice: ConsultationPrice = {
      _id: `cp${Date.now()}`,
      duration: slotDurations.find(s => s._id === duration)!,
      price: Number(price),
    };
    setConsultationPrices(prev => [...prev, newPrice]);
    setDuration('');
    setPrice('');
  };

  const handleDelete = (durationId: string) => {
    setConsultationPrices(prev => prev.filter(p => p.duration._id !== durationId));
  };

  return (
    <Box mt={4} p={3} bgcolor="#fff" borderRadius={2} boxShadow={1}>
      <Typography variant="h6">Consultation Price</Typography>
      <Grid container spacing={2} mt={2}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Duration</InputLabel>
            <Select value={duration} onChange={e => setDuration(e.target.value)}>
              {slotDurations.filter(s => s.active).map(s => (
                <MenuItem key={s._id} value={s._id}>{s.slotDuration}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <TextField fullWidth label="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        </Grid>
        <Grid item xs={2}>
          <Button variant="contained" onClick={handleAdd}>Add</Button>
        </Grid>
      </Grid>
      <Box mt={3}>
        {consultationPrices.map((p, i) => (
          <Box key={p._id} display="flex" justifyContent="space-between" alignItems="center" p={1} borderBottom="1px solid #eee">
            <Typography>{i + 1}. {p.duration.slotDuration} – ₹{p.price}</Typography>
            <IconButton onClick={() => handleDelete(p.duration._id)}><DeleteSvg /></IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};