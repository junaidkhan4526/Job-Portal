-- =============================================
-- JOB PORTAL DATABASE SCHEMA
-- Database: job_portal
-- =============================================

CREATE DATABASE IF NOT EXISTS job_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_portal;

-- Users Table (Job Seekers & Employers)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('seeker', 'employer', 'admin') DEFAULT 'seeker',
    phone VARCHAR(20),
    profile_photo VARCHAR(255),
    resume VARCHAR(255),
    skills TEXT,
    experience VARCHAR(100),
    education VARCHAR(200),
    location VARCHAR(100),
    bio TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    company_size ENUM('1-10','11-50','51-200','201-500','500+'),
    website VARCHAR(255),
    logo VARCHAR(255),
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Job Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    job_count INT DEFAULT 0
);

-- Jobs Table
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    company_id INT,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    job_type ENUM('Full-time','Part-time','Contract','Freelance','Internship') DEFAULT 'Full-time',
    work_mode ENUM('On-site','Remote','Hybrid') DEFAULT 'On-site',
    location VARCHAR(200),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_type ENUM('Monthly','Yearly','Hourly') DEFAULT 'Monthly',
    experience_level ENUM('Fresher','1-2 Years','3-5 Years','5+ Years','10+ Years') DEFAULT 'Fresher',
    education_required VARCHAR(200),
    skills_required TEXT,
    vacancies INT DEFAULT 1,
    deadline DATE,
    status ENUM('active','inactive','closed') DEFAULT 'active',
    is_featured TINYINT(1) DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Applications Table
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    seeker_id INT NOT NULL,
    cover_letter TEXT,
    resume VARCHAR(255),
    status ENUM('pending','reviewed','shortlisted','interviewed','hired','rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, seeker_id)
);

-- Saved Jobs Table
CREATE TABLE saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved (user_id, job_id)
);

-- Contact Messages
CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Admin User (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@jobportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Categories
INSERT INTO categories (name, icon) VALUES
('Information Technology', 'fas fa-laptop-code'),
('Marketing & Sales', 'fas fa-chart-line'),
('Finance & Accounting', 'fas fa-coins'),
('Healthcare', 'fas fa-heartbeat'),
('Education', 'fas fa-graduation-cap'),
('Engineering', 'fas fa-cogs'),
('Design & Creative', 'fas fa-palette'),
('Human Resources', 'fas fa-users'),
('Customer Service', 'fas fa-headset'),
('Legal', 'fas fa-balance-scale');

-- Sample Employer
INSERT INTO users (name, email, password, role, phone, location) VALUES
('Rahul Sharma', 'employer@techcorp.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', '9876543210', 'Delhi');

INSERT INTO companies (user_id, company_name, industry, company_size, website, description, city, state) VALUES
(2, 'TechCorp India', 'Information Technology', '51-200', 'https://techcorp.in', 'Leading IT solutions company in India specializing in web and mobile development.', 'Delhi', 'Delhi');

-- Sample Jobs
INSERT INTO jobs (employer_id, company_id, category_id, title, description, requirements, job_type, work_mode, location, salary_min, salary_max, experience_level, skills_required, vacancies, deadline, is_featured) VALUES
(2, 1, 1, 'Senior PHP Developer', 'We are looking for an experienced PHP Developer to join our growing team. You will work on exciting projects and collaborate with talented engineers.', 'Strong knowledge of PHP, MySQL, Laravel framework. 3+ years experience required.', 'Full-time', 'Hybrid', 'Delhi, India', 60000, 100000, '3-5 Years', 'PHP, MySQL, Laravel, JavaScript', 2, '2025-06-30', 1),
(2, 1, 1, 'React.js Frontend Developer', 'Join our frontend team to build amazing user interfaces using React.js and modern web technologies.', 'Proficiency in React.js, Redux, CSS3. Experience with REST APIs.', 'Full-time', 'Remote', 'Remote', 50000, 80000, '1-2 Years', 'React.js, JavaScript, CSS, HTML', 3, '2025-06-15', 1),
(2, 1, 2, 'Digital Marketing Manager', 'Lead our digital marketing initiatives including SEO, SEM, Social Media campaigns and content strategy.', 'Experience in Google Ads, Facebook Ads, SEO tools, Analytics.', 'Full-time', 'On-site', 'Mumbai, India', 45000, 70000, '3-5 Years', 'SEO, SEM, Google Analytics, Social Media', 1, '2025-05-30', 0),
(2, 1, 7, 'UI/UX Designer', 'Design beautiful and intuitive user interfaces for web and mobile applications.', 'Figma, Adobe XD, Sketch proficiency. Portfolio required.', 'Full-time', 'Hybrid', 'Bangalore, India', 40000, 65000, '1-2 Years', 'Figma, Adobe XD, UI/UX, Prototyping', 2, '2025-06-20', 1),
(2, 1, 3, 'Financial Analyst', 'Analyze financial data and prepare detailed reports to support business decisions.', 'CA/MBA Finance preferred. Excel, Tally proficiency required.', 'Full-time', 'On-site', 'Pune, India', 35000, 60000, 'Fresher', 'Excel, Tally, Financial Analysis', 1, '2025-07-01', 0);

COMMIT;
