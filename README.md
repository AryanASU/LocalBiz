**LocalBiz**
LocalBiz is a full-stack web application for discovering nearby local businesses and connecting with owners in real time. Customers can explore businesses based on location, like and comment on listings, and chat directly with business owners. Owners have a dedicated dashboard to manage listings and conversations.

The project is built to reflect real-world product features such as authentication, role-based access, geolocation search, and real-time messaging.

**Features**
Customer Features

Discover nearby businesses using browser geolocation

View business listings with photos, descriptions, and distance

Like and comment on businesses

Real-time chat with business owners (login required)

Top-rated nearby businesses section

Business Owner Features

Owner authentication (login & signup)

Owner-specific dashboard

Create, edit, and manage business listings

Add business logo and photos

Enter real addresses (geocoded automatically)

View customer conversations grouped by visitor

Sort conversations (Newest, Oldest, A–Z, Z–A)

Real-time chat with individual customers

Platform Features

Role-based routing (customer vs owner experience)

Persistent authentication (cookies / JWT)

Real-time messaging with Socket.io

MongoDB geospatial queries for nearby search

Optimistic UI updates with deduplication

Clean, responsive UI


**Tech Stack**

**Frontend**

React (Vite)

React Router

Plain CSS (custom UI system)

Socket.io Client


**Backend**

Node.js

Express

MongoDB + Mongoose

Socket.io

JWT / Cookie-based authentication

Multer (file uploads)

OpenStreetMap (Nominatim) for address geocoding


**Architecture Overview**

Client ↔ Server: REST APIs for auth, businesses, and comments

Real-time layer: Socket.io for live chat


**Auth flow:**

Login / signup

/auth/me used to determine role

Role-based routing on the frontend


**Chat system:**

Each business has multiple chat threads

Each customer chat is tracked separately

Owners reply from a centralized dashboard


Key Engineering Challenges Solved

Handling real-time chat duplication (optimistic UI + server events)

Reliable auth across frontend & backend during development

Geospatial search using MongoDB $geoNear

Grouping chat conversations per visitor

Address → latitude/longitude geocoding

File uploads with preview and persistence

Defensive frontend logic for inconsistent backend responses

Local Setup
Prerequisites

Node.js (v18+ recommended)

MongoDB (local or Atlas)
