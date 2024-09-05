# 🌟 DAG Royale 🚀

Welcome to DAG Royale, a game built on the Constellation Network's DAG technology. This project was created as part of the Metagraph Hackathon to showcase the potential of decentralized applications in creating engaging and fair gaming experiences.

## 🎮 What is DAG Royale?

Players send DAG tokens to a designated address, competing for a chance to win big while contributing to an ever-growing prize pool.

### ✨ Key Features

- 🏆 Daily draws with automatic prize distribution
- 📊 Real-time leaderboard updates
- 🔍 Transparent transaction history
- 🎨 Space-themed UI with parallax effects
- 📱 Responsive design for desktop and mobile

## 🛠 Installation

Get DAG Royale up and running in your local environment with these simple steps:

1. **Clone the repository**
   ```
   git clone https://github.com/deveur1000/dag-royale
   cd dag-royale
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add the following:
   ```
   DBUSER=your_database_user
   PGHOST=your_database_host
   PGDATABASE=your_database_name
   DBUSERPASSWORD=your_database_password
   PGPORT=your_database_port
   PRIVATEKEY=your_dag_private_key
   PUBLIC_KEY=your_dag_public_key
   CRON_SCHEDULE="0 21 * * *"
   ```

4. **Set up the database**
   Run the SQL scripts in the `database` folder to set up your PostgreSQL database schema.

5. **Start the server**
   ```
   npm start
   ```

6. **Open the application**
   Visit `http://localhost:3000` in your web browser to see DAG Royale in action!


## Detailed Installation Guide

For comprehensive installation instructions, please refer to our [Installation Guide](INSTALL.md).

## 🚀 Usage

1. **Connect your DAG wallet**: Ensure you have a DAG wallet set up on the Constellation Network.
2. **Make a deposit**: Send DAG tokens (minimum 5 DAG) to the displayed deposit address.
3. **Watch the leaderboard**: See your position update in real-time as other players join the fray.
4. **Cross your fingers**: Wait for the daily draw and hope for the big win!

## 📜 License

DAG Royale is released under the MIT License. See the [LICENSE](LICENSE) file for more details.

## 🏆 Hackathon Submission Details

This project was proudly submitted to the Metagraph Hackathon https://metagraph.devpost.com/. Our team, poured our hearts (and countless cups of coffee) into creating an application that not only demonstrates the power of DAG technology but also provides an entertaining and fair gaming experience.

### 🌟 Why DAG Royale Stands Out

1. **Fair Play Mechanics**: Our prize distribution algorithm ensures that every participant has a chance to win, not just the top contributors.
2. **Stunning Visuals**: The space-themed UI isn't just pretty - it's a performant, responsive design that works across devices.
3. **Real-World Potential**: While created for a hackathon, DAG Royale has the bones of a production-ready application, showcasing real-world use cases for blockchain technology in gaming.

## 🙏 Acknowledgements

- Constellation Network for their amazing DAG technology and developer support
- Our tireless team members who made this cosmic adventure possible!

---

Created with 💖 and ☕ 