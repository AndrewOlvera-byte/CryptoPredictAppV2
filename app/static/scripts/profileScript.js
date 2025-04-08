document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');
  const editableFields = document.querySelectorAll('.field-value.editable');
  
  // Original values storage
  const originalValues = {};
  
  // Mask password on page load
  const passwordField = document.querySelector('.field-value[data-field="password"]');
  if (passwordField) {
    const realPassword = passwordField.textContent.trim();
    originalValues['password'] = realPassword;
    passwordField.textContent = '••••••••';
  }
  
  // Edit mode handler
  editBtn.addEventListener('click', function() {
    // Hide edit button, show save button
    editBtn.style.display = 'none';
    saveBtn.style.display = 'flex';
    
    // Make fields editable
    editableFields.forEach(field => {
      // Store original value
      const fieldName = field.getAttribute('data-field');
      if (fieldName !== 'password') {
        originalValues[fieldName] = field.textContent.trim();
      }
      
      // Show actual password for editing
      if (fieldName === 'password') {
        field.textContent = originalValues['password'];
      }
      
      // Make field editable
      field.setAttribute('contenteditable', 'true');
      field.classList.add('editing');
      
      // Add focus effect
      field.addEventListener('focus', function() {
        this.style.boxShadow = '0 0 0 2px rgba(233, 44, 108, 0.5)';
      });
      
      field.addEventListener('blur', function() {
        this.style.boxShadow = '0 0 0 2px rgba(233, 44, 108, 0.3)';
      });
    });
    
    // Focus the first field
    if (editableFields.length > 0) {
      editableFields[0].focus();
    }
  });
  
  // Save changes handler
  saveBtn.addEventListener('click', async function() {
    // Keep track of pending updates
    const updatesPromises = [];
    const changedFields = [];
    
    // Process each editable field
    for (const field of editableFields) {
      field.removeAttribute('contenteditable');
      field.classList.remove('editing');
      field.style.boxShadow = 'none';
      
      const fieldName = field.getAttribute('data-field');
      const newValue = field.textContent.trim();
      
      // Check if the value has changed
      if (newValue !== originalValues[fieldName]) {
        changedFields.push(fieldName);
        
        // Create and send the update request
        const updatePromise = updateField(fieldName, newValue);
        updatesPromises.push(updatePromise);
      }
      
      // Re-mask password
      if (fieldName === 'password') {
        // Save the real password for future reference
        if (newValue !== originalValues['password']) {
          originalValues['password'] = newValue;
        }
        field.textContent = '••••••••';
      }
    }
    
    // If nothing changed, just return to normal mode
    if (changedFields.length === 0) {
      saveBtn.style.display = 'none';
      editBtn.style.display = 'flex';
      return;
    }
    
    try {
      // Wait for all updates to complete
      const results = await Promise.all(updatesPromises);
      
      // Check if all updates were successful
      const allSucceeded = results.every(result => result.success);
      
      if (allSucceeded) {
        showSuccessNotification();
      } else {
        // Find the first error message
        const errorResult = results.find(result => !result.success);
        showErrorNotification(errorResult ? errorResult.message : 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorNotification('Error connecting to server');
    }
    
    // Hide save button, show edit button
    saveBtn.style.display = 'none';
    editBtn.style.display = 'flex';
  });
  
  // Function to update a field
  async function updateField(field, value) {
    try {
      const formData = new FormData();
      formData.append(field, value);
      
      const response = await fetch(`/api/update_${field}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || data.error || 'Unknown error'
      };
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      return {
        success: false,
        message: `Failed to update ${field}`
      };
    }
  }
  
  // Cancel changes on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && saveBtn.style.display !== 'none') {
      // Restore original values
      editableFields.forEach(field => {
        const fieldName = field.getAttribute('data-field');
        if (originalValues[fieldName]) {
          field.textContent = originalValues[fieldName];
        }
        
        // Re-mask password
        if (fieldName === 'password') {
          field.textContent = '••••••••';
        }
      });
      
      // Hide save button, show edit button
      saveBtn.style.display = 'none';
      editBtn.style.display = 'flex';
      
      // Disable editing
      editableFields.forEach(field => {
        field.removeAttribute('contenteditable');
        field.classList.remove('editing');
        field.style.boxShadow = 'none';
      });
    }
  });
  
  // Success notification animation
  function showSuccessNotification() {
    showNotification('Profile updated successfully!', '#2d8548');
  }
  
  // Error notification
  function showErrorNotification(message) {
    showNotification(message, '#e92c6c');
  }
  
  // Generic notification function
  function showNotification(message, bgColor) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Check if it's success or error to use the right icon
    const isSuccess = bgColor === '#2d8548';
    
    notification.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="${isSuccess 
          ? 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z' 
          : 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'}"/>
      </svg>
      <span>${message}</span>
    `;
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = bgColor;
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    notification.style.transform = 'translateY(100px)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.3s ease';
    notification.style.zIndex = '1000';
    
    // Add to body
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateY(100px)';
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Add hover effects for buttons
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      // Only apply transform effect to non-back buttons
      if (!this.classList.contains('back-btn')) {
        this.style.transform = 'translateY(-2px)';
      }
    });
    
    button.addEventListener('mouseleave', function() {
      if (!this.classList.contains('back-btn')) {
        this.style.transform = 'translate(0)';
      }
    });
  });
});
