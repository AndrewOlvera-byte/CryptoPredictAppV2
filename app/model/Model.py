import json
from .User import User
from .Query import Query
from .Response import Response

class Model:
    def __init__(self, user, query, response):
        self.user = user
        self.query = query
        self.response = response
    
    def get_user(self):
        return self.user
    
    def get_query(self):
        return self.query
    
    def get_response(self):
        return self.response
    
    def clear_query(self):
        self.query = Query()
    
    def clear_response(self):
        self.response = Response()
    

    def to_json(self):
        data = {
            'user': self.user.to_json(),
            'query': self.query.to_json(),
            'response': self.response.to_json()
        }
        return json.dumps(data)

    @classmethod
    def from_json(cls, json_string):
        json_data = json.loads(json_string)
        return cls(
            User.from_json(json_data['user']),
            Query.from_json(json_data['query']),
            Response.from_json(json_data['response'])
        )
