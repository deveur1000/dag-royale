# DAG Royale Installation Guide

This guide will walk you through the process of setting up DAG Royale on your local machine for development and testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- PostgreSQL (v12.0 or later)
- Git

## Step 1: Clone the Repository

1. Open your terminal.
2. Clone the DAG Royale repository:
   ```
   git clone https://github.com/deveur1000/dag-royale/
   cd dag-royale
   ```

## Step 2: Install Dependencies

Install the project dependencies:

```
npm install
```

## Step 3: Set Up the Database

Note: The following database commands should be run in a terminal or command prompt with PostgreSQL access. Depending on your operating system and PostgreSQL installation, you may need to adjust these commands. For example, you might need to use sudo on some systems, or use the PostgreSQL command prompt on Windows.

1. Create a new PostgreSQL database for DAG Royale:
   ```
   createdb dag_royale
   ```

2. Run the database setup script:
   ```
   psql -U your_postgres_username -d dag_royale -a -f database/setup.sql
   ```
   Replace `your_postgres_username` with your actual PostgreSQL username.

3. Verify that the tables have been created successfully:
   ```
   psql -U your_postgres_username -d dag_royale -c "\dt"
   ```
   You should see `draws` and `distributions` in the list of relations.

## Step 4: Configure Environment Variables

1. Create a `.env` file in the root directory of the project:
   ```
   touch .env
   ```

2. Open the `.env` file in a text editor and add the following variables:
   ```
   DBUSER=your_postgres_username
   PGHOST=localhost
   PGDATABASE=dag_royale
   DBUSERPASSWORD=your_postgres_password
   PGPORT=5432
   PRIVATE_KEY=your_dag_private_key
   PUBLIC_KEY=your_dag_public_key
   CRON_SCHEDULE="0 21 * * *"
   ```
   Replace the placeholder values with your actual PostgreSQL credentials and DAG keys.

## Step 5: Set Up the Constellation Network Connection

1. Ensure you have a DAG wallet set up on the Constellation Network.
2. Replace `your_dag_private_key` and `your_dag_public_key` in the `.env` file with your actual DAG wallet keys.

## Step 6: Start the Application

1. Start the server:
   ```
   npm start
   ```

2. The server should now be running on `http://localhost:3000`.

## Step 7: Access the Application

Open your web browser and navigate to `http://localhost:3000`. You should see the DAG Royale interface.

## Troubleshooting

If you encounter any issues during the installation process, try the following:

1. Ensure all prerequisites are correctly installed and up to date.
2. Double-check that your `.env` file contains the correct information.
3. Make sure your PostgreSQL server is running.
4. Check the console output for any error messages.

If problems persist, please open an issue on the GitHub repository with details about the error you're encountering.

## Development Mode

To run the application in development mode with hot reloading:

```
npm run dev
```

This will start the server using nodemon, which will automatically restart the server when changes are detected in the source files.

## Updating the Application

To update the application to the latest version:

1. Pull the latest changes from the repository:
   ```
   git pull origin main
   ```

2. Install any new dependencies:
   ```
   npm install
   ```

3. Run any new database migrations (if applicable):
   ```
   npm run migrate
   ```

4. Restart the server:
   ```
   npm start
   ```
