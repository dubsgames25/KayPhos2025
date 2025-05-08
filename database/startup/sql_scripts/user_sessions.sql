CREATE TABLE user_sessions (
    user_id UUID PRIMARY KEY,
    jwt_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) -- Assuming `users` table exists
);
