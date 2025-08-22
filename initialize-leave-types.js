#!/usr/bin/env node

/**
 * Initialize Leave Types Script
 * 
 * This script creates basic leave types in the database to resolve
 * the 400 error in /api/leave/requests endpoint.
 */

const API_BASE_URL = 'http://localhost:5003/api';

// Basic leave types for Nigerian companies
const defaultLeaveTypes = [
  {
    name: 'Annual Leave',
    description: 'Yearly vacation leave',
    maxDaysPerYear: 21,
    carryForwardAllowed: true,
    requiresApproval: true
  },
  {
    name: 'Sick Leave',
    description: 'Medical leave for illness',
    maxDaysPerYear: 14,
    carryForwardAllowed: false,
    requiresApproval: false
  },
  {
    name: 'Maternity Leave',
    description: 'Maternity leave for new mothers',
    maxDaysPerYear: 90,
    carryForwardAllowed: false,
    requiresApproval: true
  },
  {
    name: 'Paternity Leave',
    description: 'Paternity leave for new fathers',
    maxDaysPerYear: 7,
    carryForwardAllowed: false,
    requiresApproval: true
  },
  {
    name: 'Emergency Leave',
    description: 'Emergency personal leave',
    maxDaysPerYear: 5,
    carryForwardAllowed: false,
    requiresApproval: true
  },
  {
    name: 'Study Leave',
    description: 'Educational or training leave',
    maxDaysPerYear: 10,
    carryForwardAllowed: true,
    requiresApproval: true
  }
];

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token (you'll need to replace this with a valid super-admin token)
  const token = process.env.SUPER_ADMIN_TOKEN || 'YOUR_SUPER_ADMIN_TOKEN_HERE';
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function initializeLeaveTypes() {
  console.log('🚀 Initializing Leave Types...\n');
  
  try {
    // First, check if leave types already exist
    console.log('📋 Checking existing leave types...');
    const existingTypes = await makeRequest('/leave/types');
    
    if (existingTypes.success && existingTypes.data?.leaveTypes?.length > 0) {
      console.log(`✅ Found ${existingTypes.data.leaveTypes.length} existing leave types:`);
      existingTypes.data.leaveTypes.forEach(type => {
        console.log(`   - ${type.name} (${type.maxDaysPerYear} days/year)`);
      });
      console.log('\n✨ Leave types already configured. System ready!');
      return;
    }
    
    console.log('📝 No leave types found. Creating default leave types...\n');
    
    // Create each leave type
    const createdTypes = [];
    for (const leaveType of defaultLeaveTypes) {
      try {
        console.log(`   Creating: ${leaveType.name}...`);
        const result = await makeRequest('/leave/types', {
          method: 'POST',
          body: JSON.stringify(leaveType),
        });
        
        if (result.success) {
          createdTypes.push(result.data.leaveType);
          console.log(`   ✅ ${leaveType.name} created successfully`);
        } else {
          console.log(`   ❌ Failed to create ${leaveType.name}: ${result.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${leaveType.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdTypes.length}/${defaultLeaveTypes.length} leave types!\n`);
    
    if (createdTypes.length > 0) {
      console.log('📋 Created leave types:');
      createdTypes.forEach(type => {
        console.log(`   - ${type.name}: ${type.maxDaysPerYear} days/year, Approval: ${type.requiresApproval ? 'Required' : 'Not Required'}`);
      });
    }
    
    console.log('\n✅ Leave types initialization complete!');
    console.log('✅ The /api/leave/requests endpoint should now work properly.');
    
  } catch (error) {
    console.error('\n❌ Failed to initialize leave types:', error.message);
    console.error('\n📝 Manual steps to fix:');
    console.error('1. Ensure you have a valid super-admin token');
    console.error('2. Update the SUPER_ADMIN_TOKEN in this script');
    console.error('3. Or create leave types manually through the admin dashboard');
    process.exit(1);
  }
}

// Usage instructions
function showUsage() {
  console.log('🔧 USAGE:');
  console.log('1. Get your super-admin auth token from the browser (login as super-admin)');
  console.log('2. Set the token: export SUPER_ADMIN_TOKEN="your_token_here"');
  console.log('3. Run: node initialize-leave-types.js');
  console.log('\nOR replace "YOUR_SUPER_ADMIN_TOKEN_HERE" in this file with your actual token\n');
}

// Main execution
if (require.main === module) {
  showUsage();
  initializeLeaveTypes();
}

module.exports = { initializeLeaveTypes, defaultLeaveTypes };