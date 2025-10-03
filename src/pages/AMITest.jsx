import React from 'react';
import AMIClick2CallTest from '../components/AMIClick2CallTest';
import PageHeader from '../components/PageHeader';

const AMITest = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="AMI Click2Call Test" 
        subtitle="Test the Python AMI integration for Asterisk PBX calling"
      />
      
      <div className="container mx-auto px-4 py-8">
        <AMIClick2CallTest />
      </div>
    </div>
  );
};

export default AMITest;
