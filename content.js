// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "highlight") {
    const count = highlightTextareas();
    sendResponse({status: `Found and highlighted ${count} textareas!`});
  } else if (request.action === "remove") {
    removeHighlights();
    sendResponse({status: "Highlights removed!"});
  }
  return true;
});

// Default protocols for text replacement
const defaultProtocols = [
  { from: 'owl', to: 'bootstrape' },
  { from: 'pl', to: 'ps' },
  { from: 'pr', to: 'pe' }
];

// Function to highlight all textareas including those in iframes
function highlightTextareas() {
  console.log("Extension running - highlighting textareas");

  // Count total textareas highlighted
  let totalTextareasHighlighted = 0;

  // Highlight textareas in the main document
  const mainTextareas = document.querySelectorAll('textarea');
  mainTextareas.forEach(textarea => {
    highlightTextarea(textarea);
    totalTextareasHighlighted++;
  });

  // Try to access iframes
  const iframes = document.querySelectorAll('iframe');
  console.log(`Found ${iframes.length} iframes`);

  iframes.forEach((iframe, index) => {
    try {
      // Only proceed if we can access the iframe content (same origin)
      if (iframe.contentDocument) {
        console.log(`Accessing iframe ${index}`);

        // Check if this iframe contains the specific div
        const targetDiv = iframe.contentDocument.querySelector('.scStretch.scFlexColumnContainer');
        if (targetDiv) {
          console.log(`Found the target div in iframe ${index}`);

          // Highlight textareas within the target div inside this iframe
          const iframeTextareas = targetDiv.querySelectorAll('textarea');
          console.log(`Found ${iframeTextareas.length} textareas inside the target div`);

          iframeTextareas.forEach(textarea => {
            highlightTextarea(textarea);
            totalTextareasHighlighted++;
          });
        } else {
          console.log(`No target div found in iframe ${index}`);
        }
      }
    } catch (error) {
      console.log(`Cannot access iframe ${index}: ${error.message}`);
    }
  });

  return totalTextareasHighlighted;
}


// Helper function to highlight a single textarea and add buttons
function highlightTextarea(textarea) {
  console.log("Highlighting textarea:", textarea);
  
  // Store original content for future use
  textarea.setAttribute('data-original-content', textarea.value);
  
  // Add a class for styling and store original styles
  textarea.setAttribute('data-original-border', textarea.style.border || '');
  textarea.setAttribute('data-original-boxShadow', textarea.style.boxShadow || '');
  textarea.style.border = '3px solid red';
  textarea.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
  
  // Create the container for buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'textarea-highlight-buttons';
  buttonsContainer.style.position = 'absolute';
  buttonsContainer.style.top = '5px';
  buttonsContainer.style.right = '5px';
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.zIndex = '10000';
  
  // Create C button (Change)
  const changeButton = createButton('C', 'red', function(e) {
    e.preventDefault();
    applyProtocols(textarea, getProtocols());
  });
  
  // Create R button (Revert)
  const revertButton = createButton('R', 'skyblue', function(e) {
    e.preventDefault();
    revertText(textarea);
  });
  
  // Create P button (Protocol)
  const protocolButton = createButton('P', 'green', function(e) {
    e.preventDefault();
    toggleProtocolEditor(textarea);
  });
  
  // Add buttons to container
  buttonsContainer.appendChild(changeButton);
  buttonsContainer.appendChild(revertButton);
  buttonsContainer.appendChild(protocolButton);
  
  // Position the textarea container (parent) as relative if it's not already
  const textareaParent = textarea.parentElement;
  const originalPosition = window.getComputedStyle(textareaParent).position;
  textareaParent.setAttribute('data-original-position', originalPosition);
  if (originalPosition === 'static') {
    textareaParent.style.position = 'relative';
  }
  
  // Add buttons container as a sibling to the textarea
  textareaParent.appendChild(buttonsContainer);
  textarea.setAttribute('data-has-buttons', 'true');
  
  // Store reference to the buttons container for later removal
  textarea.buttonsContainer = buttonsContainer;
}

// Helper function to create a button
function createButton(text, bgColor, clickHandler) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.width = '24px';
  button.style.height = '24px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = bgColor;
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.margin = '0 2px';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.justifyContent = 'center';
  button.style.alignItems = 'center';
  button.style.fontSize = '12px';
  button.style.fontWeight = 'bold';
  
  button.addEventListener('click', clickHandler);
  
  return button;
}

// Function to toggle protocol editor
function toggleProtocolEditor(textarea) {
  // Check if protocol editor already exists
  let protocolEditor = textarea.protocolEditor;
  
  if (protocolEditor) {
    // If it exists, toggle its visibility
    protocolEditor.style.display = protocolEditor.style.display === 'none' ? 'block' : 'none';
  } else {
    // Create new protocol editor
    protocolEditor = document.createElement('div');
    protocolEditor.className = 'protocol-editor';
    protocolEditor.style.position = 'absolute';
    protocolEditor.style.right = '5px';
    protocolEditor.style.top = '35px';
    protocolEditor.style.backgroundColor = 'white';
    protocolEditor.style.border = '1px solid #ccc';
    protocolEditor.style.padding = '10px';
    protocolEditor.style.borderRadius = '5px';
    protocolEditor.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    protocolEditor.style.zIndex = '10010';
    protocolEditor.style.width = '250px';
    
    // Protocol editor title
    const title = document.createElement('h4');
    title.textContent = 'Edit Protocols';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '14px';
    protocolEditor.appendChild(title);
    
    // Create textarea for protocols
    const protocolTextarea = document.createElement('textarea');
    protocolTextarea.value = getProtocolsAsText();
    protocolTextarea.style.width = '100%';
    protocolTextarea.style.height = '100px';
    protocolTextarea.style.marginBottom = '10px';
    protocolTextarea.style.resize = 'vertical';
    protocolEditor.appendChild(protocolTextarea);
    
    // Create apply button
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Protocols';
    applyButton.style.backgroundColor = '#4CAF50';
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.padding = '5px 10px';
    applyButton.style.borderRadius = '3px';
    applyButton.style.cursor = 'pointer';
    applyButton.addEventListener('click', function(e) {
      e.preventDefault();
      saveProtocols(protocolTextarea.value);
      applyProtocols(textarea, getProtocols());
      protocolEditor.style.display = 'none';
    });
    protocolEditor.appendChild(applyButton);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.padding = '5px 10px';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginLeft = '5px';
    closeButton.addEventListener('click', function(e) {
    e.preventDefault();
      protocolEditor.style.display = 'none';
    });
    protocolEditor.appendChild(closeButton);
    
    // Add protocol editor to the textarea's parent
    textarea.parentElement.appendChild(protocolEditor);
    
    // Store reference to the protocol editor
    textarea.protocolEditor = protocolEditor;
  }
}

// Function to get protocols
function getProtocols() {
  const protocolsString = localStorage.getItem('textareaHighlighterProtocols');
  if (protocolsString) {
    try {
      return JSON.parse(protocolsString);
    } catch (e) {
      console.error('Error parsing protocols:', e);
      return defaultProtocols;
    }
  }
  return defaultProtocols;
}

// Function to get protocols as text
function getProtocolsAsText() {
  const protocols = getProtocols();
  return protocols.map(p => `${p.from}|${p.to}`).join('\n');
}

// Function to save protocols
function saveProtocols(protocolsText) {
  const lines = protocolsText.split('\n');
  const protocols = lines.map(line => {
    const parts = line.split('|');
    if (parts.length === 2) {
      return { from: parts[0].trim(), to: parts[1].trim() };
    }
    return null;
  }).filter(p => p !== null);
  
  localStorage.setItem('textareaHighlighterProtocols', JSON.stringify(protocols));
}

// Function to apply protocols
function applyProtocols(textarea, protocols) {
  let content = textarea.value;
  
  // Store the original content if not already stored
  if (!textarea.hasAttribute('data-original-content')) {
    textarea.setAttribute('data-original-content', content);
  }
  
  // Apply each protocol
  protocols.forEach(protocol => {
    const regex = new RegExp(protocol.from, 'g');
    content = content.replace(regex, protocol.to);
  });
  
  // Update textarea content
  textarea.value = content;
}

// Function to revert text
function revertText(textarea) {
  const originalContent = textarea.getAttribute('data-original-content');
  if (originalContent) {
    textarea.value = originalContent;
  }
}

// Function to try highlighting nested iframes recursively
function tryHighlightNestedIframes(doc) {
  const nestedIframes = doc.querySelectorAll('iframe');
  nestedIframes.forEach((nestedIframe, index) => {
    try {
      if (nestedIframe.contentDocument) {
        const nestedTextareas = nestedIframe.contentDocument.querySelectorAll('textarea');
        nestedTextareas.forEach(textarea => {
          highlightTextarea(textarea);
        });
        
        // Go deeper if needed
        tryHighlightNestedIframes(nestedIframe.contentDocument);
      }
    } catch (error) {
      console.log(`Cannot access nested iframe: ${error.message}`);
    }
  });
}

// Function to remove highlights from all textareas including those in iframes
function removeHighlights() {
  // Remove highlights from main document
  const mainTextareas = document.querySelectorAll('textarea');
  mainTextareas.forEach(textarea => {
    removeHighlightFromTextarea(textarea);
  });
  
  // Try to access iframes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe, index) => {
    try {
      if (iframe.contentDocument) {
        const iframeTextareas = iframe.contentDocument.querySelectorAll('textarea');
        iframeTextareas.forEach(textarea => {
          removeHighlightFromTextarea(textarea);
        });
        
        // Also try to get iframe's iframes recursively
        tryRemoveHighlightsNestedIframes(iframe.contentDocument);
      }
    } catch (error) {
      console.log(`Cannot access iframe ${index} for removal: ${error.message}`);
    }
  });
}

// Helper function to remove highlight from a single textarea
function removeHighlightFromTextarea(textarea) {
  textarea.style.border = textarea.getAttribute('data-original-border') || '';
  textarea.style.boxShadow = textarea.getAttribute('data-original-boxShadow') || '';
  
  // Remove buttons container if it exists
  if (textarea.buttonsContainer) {
    textarea.buttonsContainer.remove();
    textarea.buttonsContainer = null;
  }
  
  // Remove protocol editor if it exists
  if (textarea.protocolEditor) {
    textarea.protocolEditor.remove();
    textarea.protocolEditor = null;
  }
  
  // Restore parent position if needed
  const textareaParent = textarea.parentElement;
  const originalPosition = textareaParent.getAttribute('data-original-position');
  if (originalPosition) {
    textareaParent.style.position = originalPosition;
    textareaParent.removeAttribute('data-original-position');
  }
  
  // Remove data attributes
  textarea.removeAttribute('data-has-buttons');
  textarea.removeAttribute('data-original-border');
  textarea.removeAttribute('data-original-boxShadow');
  // Don't remove data-original-content in case they want to revert later
}

// Function to try removing highlights from nested iframes recursively
function tryRemoveHighlightsNestedIframes(doc) {
  const nestedIframes = doc.querySelectorAll('iframe');
  nestedIframes.forEach((nestedIframe, index) => {
    try {
      if (nestedIframe.contentDocument) {
        const nestedTextareas = nestedIframe.contentDocument.querySelectorAll('textarea');
        nestedTextareas.forEach(textarea => {
          removeHighlightFromTextarea(textarea);
        });
        
        // Go deeper if needed
        tryRemoveHighlightsNestedIframes(nestedIframe.contentDocument);
      }
    } catch (error) {
      console.log(`Cannot access nested iframe for removal: ${error.message}`);
    }
  });
}

// Initialize protocols if they don't exist yet
if (!localStorage.getItem('textareaHighlighterProtocols')) {
  localStorage.setItem('textareaHighlighterProtocols', JSON.stringify(defaultProtocols));
}