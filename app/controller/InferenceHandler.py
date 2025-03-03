import torch
import torch.nn as nn

class InferenceHandler:
    def __init__(self):
        # For illustration, create a dummy model. In practice, load your actual model.
        self.model = nn.Linear(3, 1)
        self.model.eval()

    def preprocess(self, request):
        """
        Convert request dictionary to a tensor.
        Assumes each request has an "input" key.
        """
        input_data = request.get("input")
        return torch.tensor(input_data, dtype=torch.float32)

    def inference(self, batched_input):
        """
        Run the model on the batched input.
        """
        with torch.no_grad():
            return self.model(batched_input)

    def postprocess(self, inference_output):
        """
        Convert model output tensor to a list for easy serialization.
        """
        return inference_output.tolist()

    def handle(self, data, context):
        """
        TorchServe calls this method with a list of requests (batch).
        """
        if not data:
            return []

        # Preprocess each request in the batch
        inputs = [self.preprocess(request) for request in data]
        
        # Combine individual inputs into a single batched tensor
        batched_input = torch.stack(inputs)
        
        # Perform inference on the batched tensor
        batched_output = self.inference(batched_input)
        
        # Postprocess and return a list where each element corresponds to a request
        return [self.postprocess(output) for output in batched_output]