// document.getElementById('highlight').addEventListener('click', function() {
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     // Make sure we have a valid tab
//     if (tabs && tabs[0] && tabs[0].id) {
//       // Send message and handle potential error
//       chrome.tabs.sendMessage(tabs[0].id, {action: "highlight"}, function(response) {
//         if (chrome.runtime.lastError) {
//           // Handle the error gracefully
//           document.getElementById('status').textContent = "Error: Content script not ready. Please refresh the page.";
//         } else {
//           document.getElementById('status').textContent = response ? response.status : "Textareas highlighted!";
//         }
//       });
//     } else {
//       document.getElementById('status').textContent = "Error: No active tab found";
//     }
//   });
// });

document.getElementById('remove').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // Make sure we have a valid tab
    if (tabs && tabs[0] && tabs[0].id) {
      // Send message and handle potential error
      chrome.tabs.sendMessage(tabs[0].id, {action: "remove"}, function(response) {
        if (chrome.runtime.lastError) {
          // Handle the error gracefully
          document.getElementById('status').textContent = "Error: Content script not ready. Please refresh the page.";
        } else {
          document.getElementById('status').textContent = response ? response.status : "Highlights removed!";
        }
      });
    } else {
      document.getElementById('status').textContent = "Error: No active tab found";
    }
  });
});

document.addEventListener("DOMContentLoaded", function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // Make sure we have a valid tab
    if (tabs && tabs[0] && tabs[0].id) {
      // Send message and handle potential error
      chrome.tabs.sendMessage(tabs[0].id, {action: "highlight"}, function(response) {
        if (chrome.runtime.lastError) {
          // Handle the error gracefully
          document.getElementById('status').textContent = "Error: Content script not ready. Please refresh the page.";
        } else {
          document.getElementById('status').textContent = response ? response.status : "Textareas highlighted!";
        }
      });
    } else {
      document.getElementById('status').textContent = "Error: No active tab found";
    }
  });
});