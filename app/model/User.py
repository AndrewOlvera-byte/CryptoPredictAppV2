from datetime import datetime
import json

class User:
    def __init__(self, username, password, email, current_query_count, query_limit, last_reset_date, subscription_type):
        self.username = username
        self.password = password
        self.email = email
        self.current_query_count = current_query_count
        self.query_limit = query_limit
        self.last_reset_date = last_reset_date
        self.subscription_type = subscription_type
    
    def update_query_count(self, query_count):
        self.current_query_count += query_count
        if self.current_query_count > self.query_limit:
            self.current_query_count = self.query_limit
    
    def reset_query_count(self):
        self.current_query_count = 0
        self.last_reset_date = datetime.now().strftime("%Y-%m-%d")
    
    def update_username(self, username):
        self.username = username
    
    def update_password(self, password):
        self.password = password
    
    def update_email(self, email):
        self.email = email
    
    def update_subscription_type(self, subscription_type):
        self.subscription_type = subscription_type

    def load_user_data(self, user_data):
        (
            user_id,
            username,
            password,
            email,
            current_query_count,
            last_reset_date,
            subscription_type
        ) = user_data
        
        self.user_id = user_id
        self.username = username
        self.password = password
        self.email = email
        self.current_query_count = current_query_count
        self.last_reset_date = last_reset_date  # Typically a string from DB
        self.subscription_type = subscription_type
        
        if self.subscription_type == "free":
            self.query_limit = 10
        elif self.subscription_type == "premium":
            self.query_limit = 100
        elif self.subscription_type == "special":
            self.query_limit = 10000

    def to_json(self):
        if isinstance(self.last_reset_date, datetime):
            last_reset_str = self.last_reset_date.isoformat()
        else:
            # If it's already a string (the usual case), just use that
            last_reset_str = self.last_reset_date

        return {
            'user_id': getattr(self, 'user_id', None),
            'username': self.username,
            'password': self.password,
            'email': self.email,
            'current_query_count': self.current_query_count,
            'last_reset_date': last_reset_str,
            'subscription_type': self.subscription_type
        }
    
    @classmethod
    def from_json(cls, user_dict):
        user = cls(
            user_dict.get('username', ''),
            user_dict.get('password', ''),
            user_dict.get('email', '')
        )
        user.current_query_count = user_dict.get('current_query_count', 0)
        user.last_reset_date = user_dict.get('last_reset_date', '')
        user.subscription_type = user_dict.get('subscription_type', 'Base')
        user.user_id = user_dict.get('user_id', None)  # If present
        return user
