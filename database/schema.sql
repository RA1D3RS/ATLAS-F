-- database/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'investor', 'company')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    profile_picture VARCHAR(255)
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    short_description TEXT,
    full_description TEXT,
    funding_goal DECIMAL(15, 2),
    min_investment DECIMAL(15, 2),
    funding_type VARCHAR(20) CHECK (funding_type IN ('equity', 'donation')),
    equity_structure TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'funded', 'failed')),
    industry_sector VARCHAR(100),
    impact_type VARCHAR(20) CHECK (impact_type IN ('social', 'environmental', 'both', 'none')),
    video_url VARCHAR(255),
    image_path VARCHAR(255),
    start_date DATE,
    end_date DATE,
    reviewer_id UUID REFERENCES users(id),
    risk_rating INTEGER CHECK (risk_rating BETWEEN 1 AND 5),
    review_notes TEXT,
    platform_fee_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);