# Project eBersih

This document provides a comprehensive overview of the eBersih project, including its structure, technologies, and development conventions.

## Project Overview

eBersih is a full-stack application designed for managing cleaning services. It consists of a web-based client, a mobile application for cleaners, and a backend server that powers both.

### Technologies Used

*   **Web (Next.js):** The web client is built with [Next.js](https://nextjs.org/), a popular React framework for building server-rendered applications.
*   **Mobile (React Native - Expo):** The mobile application is developed using [React Native](https://reactnative.dev/) with the [Expo](https://expo.dev/) framework, allowing for cross-platform development for Android and iOS.
*   **Backend (Python - FastAPI):** The backend is a robust API built with [FastAPI](https://fastapi.tiangolo.com/), a modern, high-performance web framework for Python.

## Project Structure

The project is organized into three main directories:

*   `web/`: Contains the source code for the Next.js web application.
*   `mobile/`: Contains the source code for the React Native mobile application.
*   `backend/`: Contains the source code for the FastAPI backend server.

## Getting Started

### Web Application

To run the web application, navigate to the `web/` directory and follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### Mobile Application

To run the mobile application, navigate to the `mobile/` directory and follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npx expo start
    ```
    This will open the Expo developer tools, where you can choose to run the app on a simulator or a physical device.

### Backend Server

To run the backend server, navigate to the `backend/` directory and follow these steps:

1.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Start the server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Development Conventions

*   **Linting:** Both the web and mobile projects are configured with ESLint for code linting. Please run `npm run lint` in the respective directories to check for any linting errors.
*   **Code Style:** Please adhere to the existing code style and conventions used in the project.
