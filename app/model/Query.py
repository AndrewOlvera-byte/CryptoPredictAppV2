import json

class Query:
    def __init__(self):
        self.prod_id = ""
    
    def get_prod_id(self):
        return self.prod_id

    def set_prod_id(self, prod_id):
        self.prod_id = prod_id

    def to_json(self):
        return {
            'prod_id': self.prod_id
        }
    
    @classmethod
    def from_json(cls, dict_obj):
        """
        dict_obj is a dictionary, not a JSON string. We'll parse it directly.
        """
        return cls(dict_obj.get('prod_id', ''))
