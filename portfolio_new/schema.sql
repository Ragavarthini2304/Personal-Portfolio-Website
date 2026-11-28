CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    tech TEXT NOT NULL,
    link TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects (title, description, tech, link) VALUES
(
 'SmartScore AI',
 'Student Performance Prediction and Personalized Study Assistant. Predicts student outcomes and supports personalized study planning.',
 'Python, Machine Learning, Streamlit',
 'https://github.com/Ragavarthini2304/Student-Performance-Prediction'
),
(
 'Project Management System',
 'A web-based system for managing employees, projects and tasks, including task assignments, deadlines and status tracking.',
 'HTML, CSS, JavaScript, PHP, MySQL',
 'https://github.com/Ragavarthini2304/Project-Management-System'
),
(
 'Personal Portfolio Website',
 'A responsive personal portfolio showcasing profile information, technical skills and projects.',
 'HTML, CSS, JavaScript, Flask, PostgreSQL',
 'https://github.com/Ragavarthini2304/Personal-Portfolio-Website'
)
ON CONFLICT (title) DO UPDATE SET
    description = EXCLUDED.description,
    tech = EXCLUDED.tech,
    link = EXCLUDED.link;
