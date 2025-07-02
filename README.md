# Car Trading Platform API

A comprehensive Node.js API for a cross-platform car trading application with multiple user modules including sellers, dealers, mechanics, towing services, and regular users.

## Features

- **Multi-module Architecture**: Separate modules for users, sellers, dealers, mechanics, and towing services
- **Real-time Chat**: WebSocket-based chat system for communication between users
- **Car Listings**: Complete CRUD operations for car listings with advanced filtering
- **Authentication & Authorization**: JWT-based authentication with role-based access
- **File Upload Support**: Image upload for car listings and user profiles
- **Search & Filtering**: Advanced search and filtering capabilities
- **Rating System**: Rating and review system for all service providers

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env` file in the root directory:
   \`\`\`
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/car-trading
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   \`\`\`

4. Start the server:
   \`\`\`bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Cars
- `GET /api/cars` - Get all cars with filtering
- `GET /api/cars/featured` - Get featured cars
- `GET /api/cars/:id` - Get single car
- `POST /api/cars` - Create car listing (Auth required)
- `PUT /api/cars/:id` - Update car listing (Auth required)
- `DELETE /api/cars/:id` - Delete car listing (Auth required)

### Sellers
- `POST /api/sellers/profile` - Create seller profile
- `GET /api/sellers/profile` - Get seller profile
- `GET /api/sellers/cars` - Get seller's cars

### Dealers
- `POST /api/dealers/profile` - Create dealer profile
- `GET /api/dealers/profile` - Get dealer profile

### Mechanics
- `POST /api/mechanics/profile` - Create mechanic profile
- `GET /api/mechanics` - Get all mechanics

### Towing Services
- `POST /api/towing/profile` - Create towing service profile
- `GET /api/towing` - Get all towing services

### Chat
- `GET /api/chat` - Get user chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/:chatId/messages` - Get chat messages

## WebSocket Events

### Client to Server
- `join` - Join user's personal room
- `joinChat` - Join specific chat room
- `sendMessage` - Send message to chat
- `typing` - Send typing indicator

### Server to Client
- `newMessage` - Receive new message
- `messageNotification` - Receive message notification
- `userTyping` - Receive typing indicator
- `error` - Receive error messages

## Database Models

### User
- Basic user information
- Authentication credentials
- Role-based access (user, seller, dealer, mechanic, towing)

### Car
- Complete car listing information
- Images, specifications, pricing
- Owner relationship and search indexing

### Seller/Dealer/Mechanic/Towing
- Professional service provider profiles
- Business information and credentials
- Rating and verification system

### Chat
- Real-time messaging system
- Message history and participant management
- Car-specific conversations

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Usage Examples

### Register a new user
\`\`\`javascript
POST /api/users/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "city": "New York"
}
\`\`\`

### Create a car listing
\`\`\`javascript
POST /api/cars
Authorization: Bearer <token>
{
  "title": "2020 Toyota Camry",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "price": 25000,
  "mileage": 15000,
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "bodyType": "Sedan",
  "color": "White",
  "city": "New York",
  "description": "Well maintained car...",
  "images": ["image1.jpg", "image2.jpg"]
}
\`\`\`

### Search cars
\`\`\`javascript
GET /api/cars?make=Toyota&minPrice=20000&maxPrice=30000&city=New York
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
