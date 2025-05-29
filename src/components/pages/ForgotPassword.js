import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import styled from 'styled-components';

// Styles avec styled-components
const Container = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1e1e2f;
`;

const ForgotPasswordBox = styled(motion.div)`
  background: #2a2a3a;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  width: 350px;
  text-align: center;
  color: white;
`;

const InputGroup = styled(motion.div)`
  margin-bottom: 15px;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  outline: none;
  font-size: 16px;
  background: #3a3a4a;
  color: white;
  transition: all 0.3s ease;
  &:focus {
    background: #4a4a5a;
    box-shadow: 0px 0px 8px rgba(0, 0, 255, 0.5);
  }
`;

const Button = styled(motion.button)`
  width: 100%;
  background: #007bff;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: #0056b3;
    box-shadow: 0px 4px 12px rgba(0, 123, 255, 0.4);
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(1px);
  }
`;

const Message = styled(motion.div)`
  color: #ff5555;
  font-size: 14px;
  margin-bottom: 10px;
  text-align: center;
`;

const UserInfo = styled.div`
  margin-top: 20px;
  text-align: left;
  p {
    margin: 5px 0;
  }
  strong {
    color: #007bff;
  }
`;

const ResendButton = styled(Button)`
  margin-top: 10px;
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  // Handle password reset request
  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email.");
      return;
    }
    try {
      // Simulate API request (replace with actual backend API)
      const response = await axios.post('http://localhost:4000/forgot-password', { email });
      if (response.data.user) {
        setUser(response.data.user); // Store user details (name & email)
        setMessage(''); // Clear message if user is found
      } else {
        setMessage("No account found with this email.");
      }
    } catch (error) {
      setMessage("Error processing your request. Please try again.");
    }
  };

  // Resend the reset link
  const handleResend = async () => {
    try {
      await axios.post('http://localhost:4000/resend-reset-link', { email });
      setMessage("A new reset link has been sent to your email.");
    } catch (error) {
      setMessage("Failed to resend the link. Please try again.");
    }
  };

  return (
    <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <ForgotPasswordBox initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }}>
        <h2>Forgot Password</h2>
        <form onSubmit={handleReset}>
          {/* Email Input */}
          <InputGroup whileHover={{ scale: 1.05 }}>
            <Label>Email:</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </InputGroup>
          {/* Submit Button */}
          <Button type="submit" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            Verify Email
          </Button>
        </form>
        {/* Display user details if email exists */}
        {user && (
          <UserInfo>
            <h3>Account Found:</h3>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <ResendButton onClick={handleResend} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              Resend Reset Link
            </ResendButton>
          </UserInfo>
        )}
        {/* Display message if email not found or error occurs */}
        {message && <Message initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{message}</Message>}
      </ForgotPasswordBox>
    </Container>
  );
};

export default ForgotPassword;