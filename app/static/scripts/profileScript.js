document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');
  const editableFields = document.querySelectorAll('.field-value.editable');
  
  // Original values storage
  const originalValues = {};
  
  // Edit mode handler
  editBtn.addEventListener('click', function() {
    // Hide edit button, show save button
    editBtn.style.display = 'none';
    saveBtn.style.display = 'flex';
    
    // Make fields editable
    editableFields.forEach(field => {
      // Store original value
      const fieldName = field.getAttribute('data-field');
      originalValues[fieldName] = field.textContent;
      
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
  saveBtn.addEventListener('click', function() {
    // Hide save button, show edit button
    saveBtn.style.display = 'none';
    editBtn.style.display = 'flex';
    
    // Disable editing
    editableFields.forEach(field => {
      field.removeAttribute('contenteditable');
      field.classList.remove('editing');
      field.style.boxShadow = 'none';
      
      // Here you would typically send an API request to update the profile
      // For example: updateProfileField(field.getAttribute('data-field'), field.textContent);
    });
    
    // Show success animation
    showSuccessNotification();
  });
  
  // Cancel changes on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && saveBtn.style.display !== 'none') {
      // Restore original values
      editableFields.forEach(field => {
        const fieldName = field.getAttribute('data-field');
        if (originalValues[fieldName]) {
          field.textContent = originalValues[fieldName];
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
      <span>Profile updated successfully!</span>
    `;
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#2d8548';
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
      this.style.transform = this.classList.contains('back-btn') ? 
        'translateX(-5px)' : 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translate(0)';
    });
  });
});
