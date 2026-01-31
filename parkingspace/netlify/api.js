// netlify/functions/api.js
const serverless = require('serverless-http');
const express = require('express');
const app = require('../../src/app'); // Your existing Express app

// Wrap your Express app with serverless-http
exports.handler = serverless(app);