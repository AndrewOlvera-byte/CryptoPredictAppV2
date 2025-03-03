import mysql.connector
from mysql.connector import Error
from datetime import datetime

class dbHandler:
    def __init__(self):
        self.connection = None
        self.cursor = None
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'Ao08062003-',
            'database': 'crypto_app',
            'auth_plugin': 'mysql_native_password'
        }

    def connect_to_db(self):
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            print("Database connected")
            return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False

    def disconnect_from_db(self):
        if self.connection:
            self.cursor.close()
            self.connection.close()
            print("Database connection closed")
    
    def get_user_data(self, user_id):
        try:
            self.connect_to_db()  
            self.cursor = self.connection.cursor(dictionary=True)
            query = "SELECT * FROM users WHERE user_id = %s"
            self.cursor.execute(query, (user_id,))
            
            user_data = self.cursor.fetchone()

            

            if user_data:
                
                user_id = user_data["user_id"]
                username = user_data["username"]
                password = user_data["password"]
                email = user_data["email"]
                current_query_count = user_data["current_query_count"]
                last_reset_date = user_data["last_reset_date"]
                subscription_type = user_data["subscription_type"]

                return user_id, username, password, email, current_query_count, last_reset_date, subscription_type
            else:
                return None
        except Error as e:
            print(f"Error fetching user data: {e}")
            return None
        finally:
            self.disconnect_from_db()
    
    def update_user_data(self, user_id, username, password, email, current_query_count, query_limit, last_reset_date, subscription_type):
        try:
            self.connect_to_db()
            self.cursor = self.connection.cursor()
            query = "UPDATE users SET username = %s, password = %s, email = %s, current_query_count = %s, query_limit = %s, last_reset_date = %s, subscription_type = %s WHERE user_id = %s"
            self.cursor.execute(query, (username, password, email, current_query_count, query_limit, last_reset_date, subscription_type, user_id))
            self.connection.commit()
        except Error as e:
            print(f"Error updating user data: {e}")
        finally:
            self.disconnect_from_db()

    def create_user(self, username, password, email):
        current_query_count = 0
        last_reset_date = datetime.now()
        subscription_type = "free"
        try:
            self.connect_to_db()
            self.cursor = self.connection.cursor()
            query = "INSERT INTO users (username, password, email, current_query_count, last_reset_date, subscription_type) VALUES (%s, %s, %s, %s, %s, %s)"
            self.cursor.execute(query, (username, password, email, current_query_count, last_reset_date, subscription_type))
            self.connection.commit()
            return True
        except Error as e:
            print(f"Error creating user: {e}")
            return False
        finally:
            self.disconnect_from_db()

    def delete_user(self, user_id):
        try:
            if self.connect_to_db():
                self.cursor = self.connection.cursor()
                query = "DELETE FROM users WHERE user_id = %s"
                self.cursor.execute(query, (user_id,))
                self.connection.commit()
                return True
            else:
                return False
        except Error as e:
            print(f"Error deleting user: {e}")
        finally:
            self.disconnect_from_db()

    def validate_user(self, username_email, password):
        try:
            self.connect_to_db()
            self.cursor = self.connection.cursor()
            
            query = """
                SELECT COUNT(*) AS match_count
                FROM users
                WHERE (username = %s OR email = %s)
                AND password = %s
            """
            self.cursor.execute(query, (username_email, username_email, password))
            row = self.cursor.fetchone()
            
            if row and row[0] > 0:  # row[0] is the match_count
                return True
            return False

        except Error as e:
            print(f"Error validating user: {e}")
            return False
        finally:
            self.disconnect_from_db()


    def get_user_id(self, username_email):
        try:
            self.connect_to_db()
            self.cursor = self.connection.cursor(dictionary=True)
            query = "SELECT user_id FROM users WHERE username = %s OR email = %s"
            self.cursor.execute(query, (username_email,username_email,))
            user_data = self.cursor.fetchone()
            if user_data:
                return user_data["user_id"]
            return None
        except Error as e:
            print(f"Error getting user id: {e}")
            return None
        finally:
            self.disconnect_from_db()
