import React, { useState } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { InputBase, Autocomplete, TextField, Box, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const fetchStockOptions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, we would call the API for stocks
      // For this example, we'll use mock data
      const mockOptions = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'META', name: 'Meta Platforms Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.' }
      ];
      
      const filteredOptions = mockOptions.filter(
        option => option.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setOptions(filteredOptions);
    } catch (error) {
      console.error('Error fetching stock options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    fetchStockOptions(newInputValue);
  };
  
  const handleOptionSelected = (event, option) => {
    if (option) {
      navigate(`/stocks/${option.symbol}`);
    }
    setInputValue('');
  };
  
  return (
    <Autocomplete
      id="stock-search"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleOptionSelected}
      options={options}
      getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
      loading={loading}
      noOptionsText="No stocks found"
      sx={{ width: 300 }}
      renderInput={(params) => (
        <Search>
          <SearchIconWrapper>
            <SearchIcon sx={{ color: 'white' }} />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search Stocks…"
            inputProps={{ ...params.inputProps, 'aria-label': 'search' }}
            ref={params.InputProps.ref}
            sx={{ width: '100%' }}
          />
          {loading ? (
            <CircularProgress color="inherit" size={20} sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }} />
          ) : null}
        </Search>
      )}
    />
  );
};

export default SearchBar; 