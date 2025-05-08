#!/bin/bash
# Generate the JWT secret
echo "JWT_SECRET generated: $JWT_SECRET"

# Run the server
exec ./main
