# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this application, please send an email to the project maintainer. All security vulnerabilities will be promptly addressed.

## Security Measures

### Environment Variables
- All sensitive information is stored in environment variables
- `.env` file is excluded from version control
- Production environment variables are managed through hosting platform

### Authentication
- Session-based authentication with secure cookies
- Admin authentication required for sensitive operations
- JWT tokens for API authentication

### Database Security
- MongoDB connection uses authentication
- Connection string includes SSL/TLS encryption
- Database access is restricted to authenticated users only

### API Security
- Input validation on all endpoints
- Rate limiting on message endpoints
- CORS configuration for cross-origin requests

### Data Protection
- User passwords are hashed using bcrypt
- Activation codes are single-use and time-limited
- Personal data is encrypted in transit and at rest

## Best Practices

1. **Never commit sensitive data** to version control
2. **Use strong passwords** for admin accounts
3. **Regularly update dependencies** to patch security vulnerabilities
4. **Monitor application logs** for suspicious activity
5. **Use HTTPS** in production environments

## Security Checklist

- [x] Environment variables properly configured
- [x] Sensitive files excluded from Git
- [x] Database connection secured
- [x] Authentication implemented
- [x] Input validation in place
- [x] Password hashing implemented
- [x] HTTPS enforced in production
