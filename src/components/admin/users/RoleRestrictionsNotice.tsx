
import React from 'react';
import { Shield } from 'lucide-react';

const RoleRestrictionsNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5 text-amber-600" />
        <div>
          <h3 className="text-sm font-medium text-amber-800">Role Restrictions</h3>
          <p className="text-sm text-amber-700">
            Only one Admin account is allowed. New users can only be assigned the Reader role with limited access permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleRestrictionsNotice;
