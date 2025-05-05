# E-Commerce API Documentation

## Authentication APIs

- Register: POST `/api/v1/auth/register` - Create new user account
- Login: POST `/api/v1/auth/login` - User authentication
- Change Password: POST `/api/v1/auth/change-password` - Update user password
- Refresh Token: POST `/api/v1/auth/refresh-token` - Get new access token
- Logout: POST `/api/v1/auth/logout` - End user session
- Google OAuth: GET `/api/v1/auth/google` - Google authentication
- Password Management:
  - Forgot Password: POST `/api/v1/auth/forgot-password`
  - Reset Password: POST `/api/v1/auth/reset-password`
  - Request Password Creation: POST `/api/v1/auth/request-password-creation`
  - Create Password: POST `/api/v1/auth/create-password`
- Account Management:
  - Deactivate Account: PATCH `/api/v1/auth/deactivate`
  - Update Profile: PATCH `/api/v1/auth/profile`

## Roles APIs

- Create Role: POST `/api/v1/roles`
- List Roles: GET `/api/v1/roles`
- Get Role: GET `/api/v1/roles/{role_id}`
- Update Role: PUT `/api/v1/roles/{role_id}`
- Delete Role: DELETE `/api/v1/roles/{role_id}`
- List Permissions: GET `/api/v1/roles/permissions`

## Users APIs

- Create User: POST `/api/v1/users`
- Get User: GET `/api/v1/users/{user_id}`
- List Users: GET `/api/v1/users` (with pagination)
- Update User: PUT `/api/v1/users/{user_id}`
- Delete User: DELETE `/api/v1/users/{user_id}`
- User Status:
  - Deactivate: PATCH `/api/v1/users/{user_id}/deactivate`
  - Reactivate: PATCH `/api/v1/users/{user_id}/reactivate`

## Categories APIs

- Add Category: POST `/api/v1/categories`
- Get Category: GET `/api/v1/categories/{category_id}`
- List Categories: GET `/api/v1/categories` (with pagination)
- Update Category: PUT `/api/v1/categories/{category_id}`
- Delete Category: DELETE `/api/v1/categories/{category_id}`
- Category Status:
  - Deactivate: PATCH `/api/v1/categories/{category_id}/deactivate`
  - Reactivate: PATCH `/api/v1/categories/{category_id}/reactivate`

## Services APIs

- Add Service: POST `/api/v1/services`
- Get Service: GET `/api/v1/services/{service_id}`
- List Services:
  - Active Services: GET `/api/v1/services/active`
  - All Services: GET `/api/v1/services` (with pagination)
- Update Service: PUT `/api/v1/services/{service_id}`
- Delete Service: DELETE `/api/v1/services/{service_id}`

## Appointments APIs

- Create Appointment: POST `/api/v1/appointments`
- Get Appointment: GET `/api/v1/appointments/{appointment_id}`
- Update Appointment: PUT `/api/v1/appointments/{appointment_id}`
- List Appointments:
  - User Appointments: GET `/api/v1/appointments/user/appointments`
  - Stylist Appointments: GET `/api/v1/appointments/stylist/appointments`
  - All Appointments: GET `/api/v1/appointments` (with filters)
- Statistics:
  - Total Income: GET `/api/v1/appointments/stats/income`
  - Total Services: GET `/api/v1/appointments/stats/services`
