// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const Container = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1e1e2f;
`;

const LoginBox = styled(motion.div)`
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

const ErrorMessage = styled(motion.div)`
  color: #ff5555;
  font-size: 14px;
  margin-bottom: 10px;
  text-align: left;
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

const ForgotPasswordLink = styled.a`
  display: block;
  margin-top: 10px;
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    text-decoration: underline;
    color: #0056b3;
  }
`;

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    try {
      const response = await axios.post(
        'http://localhost:4000/login',
        { email, password },
        { withCredentials: true }
      );
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('category', user.category);
      navigate('/home');
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.error); // "Votre compte est désactivé."
      } else {
        const msg = err.response?.data?.error || 'Erreur lors de la connexion';
        setError(msg);
      }
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <LoginBox
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <h2>Connexion</h2>
        <form onSubmit={handleLogin}>
          <InputGroup whileHover={{ scale: 1.05 }}>
            <Label>Email :</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Entrez votre email"
            />
          </InputGroup>
          <InputGroup whileHover={{ scale: 1.05 }}>
            <Label>Mot de passe :</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Entrez votre mot de passe"
            />
          </InputGroup>
          {error && (
            <ErrorMessage
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </ErrorMessage>
          )}
          <Button
            type="submit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Se connecter
          </Button>
        </form>
        <ForgotPasswordLink onClick={handleForgotPassword}>
          Mot de passe oublié ?
        </ForgotPasswordLink>
      </LoginBox>
    </Container>
  );
};

export default Login;
