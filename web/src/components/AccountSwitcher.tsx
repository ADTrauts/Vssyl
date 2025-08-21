'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Avatar } from 'shared/components';
import { businessAPI } from '../api/business';
import { educationalAPI } from '../api/educational';
import { Building2, User, Plus, ChevronRight, GraduationCap, Settings } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  ein: string;
  members: Array<{
    id: string;
    role: string;
    title?: string;
    department?: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  dashboards: Array<{
    id: string;
    name: string;
  }>;
}

interface EducationalInstitution {
  id: string;
  name: string;
  type: string;
  members: Array<{
    id: string;
    role: string;
    title?: string;
    department?: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  dashboards: Array<{
    id: string;
    name: string;
  }>;
}

interface AccountSwitcherProps {
  onClose?: () => void;
  showButton?: boolean;
  showModal?: boolean;
}

export default function AccountSwitcher({ onClose, showButton = true, showModal: externalShowModal }: AccountSwitcherProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [institutions, setInstitutions] = useState<EducationalInstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external showModal prop if provided, otherwise use internal state
  const isModalOpen = externalShowModal !== undefined ? externalShowModal : showModal;

  useEffect(() => {
    if (isModalOpen) {
      loadAccounts();
    }
  }, [isModalOpen]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [businessResponse, institutionResponse] = await Promise.all([
        businessAPI.getUserBusinesses(),
        educationalAPI.getUserInstitutions()
      ]);
      
      if (businessResponse.success) {
        setBusinesses(businessResponse.data);
      }
      
      if (institutionResponse.success) {
        setInstitutions(institutionResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToPersonal = () => {
    // Switch to personal dashboard
    router.push('/dashboard');
    setShowModal(false);
    onClose?.();
  };

  const handleSwitchToBusiness = (business: Business) => {
    // Switch to business workspace (completely separate experience)
    router.push(`/business/${business.id}/workspace`);
    setShowModal(false);
    onClose?.();
  };

  const handleSwitchToInstitution = (institution: EducationalInstitution) => {
    // Switch to institution dashboard
    if (institution.dashboards.length > 0) {
      router.push(`/dashboard/${institution.dashboards[0].id}`);
    } else {
      // If no dashboard exists, create one or redirect to institution creation
      router.push(`/educational/${institution.id}/dashboard`);
    }
    setShowModal(false);
    onClose?.();
  };

  const handleCreateBusiness = () => {
    router.push('/business/create');
    setShowModal(false);
    onClose?.();
  };

  const handleCreateInstitution = () => {
    router.push('/educational/create');
    setShowModal(false);
    onClose?.();
  };

  const handleManageBusiness = (business: Business, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the business switch
    router.push(`/business/${business.id}/profile`);
    setShowModal(false);
    onClose?.();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    onClose?.();
  };

  const getUserRole = (business: Business) => {
    const userMember = business.members.find(member => 
      member.user.email === session?.user?.email
    );
    return userMember?.role || 'EMPLOYEE';
  };

  const getInstitutionUserRole = (institution: EducationalInstitution) => {
    const userMember = institution.members.find(member => 
      member.user.email === session?.user?.email
    );
    return userMember?.role || 'STUDENT';
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Employee';
      case 'FACULTY':
        return 'Faculty';
      case 'STAFF':
        return 'Staff';
      case 'STUDENT':
        return 'Student';
      default:
        return role;
    }
  };

  const getInstitutionTypeDisplay = (type: string) => {
    switch (type) {
      case 'UNIVERSITY':
        return 'University';
      case 'COLLEGE':
        return 'College';
      case 'HIGH_SCHOOL':
        return 'High School';
      case 'ELEMENTARY_SCHOOL':
        return 'Elementary School';
      default:
        return type;
    }
  };

  return (
    <>
      {showButton && (
        <Button
          variant="secondary"
          onClick={() => {
            if (externalShowModal === undefined) {
              setShowModal(true);
            }
          }}
          className="flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Switch Accounts</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      <Modal open={isModalOpen} onClose={handleCloseModal} title="Switch Accounts" size="large">
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Personal Account */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
               onClick={handleSwitchToPersonal}>
            <div className="flex items-center space-x-4">
              <Avatar
                src={session?.user?.image || undefined}
                alt={session?.user?.name || 'Personal'}
                size={48}
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {session?.user?.name || 'Personal Account'}
                </h3>
                <p className="text-sm text-gray-600">{session?.user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">Personal workspace</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Business Accounts */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Business Accounts
            </h4>
            {businesses.length === 0 ? (
              <div className="text-gray-400 text-sm mb-3">No businesses yet.</div>
            ) : (
              <div className="space-y-3 mb-3">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => handleSwitchToBusiness(business)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {business.name}
                        </h3>
                        <p className="text-sm text-gray-600">EIN: {business.ein}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRoleDisplayName(getUserRole(business))} • {business.members.length} members
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(event) => handleManageBusiness(business, event)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Manage Business"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="secondary"
              onClick={handleCreateBusiness}
              className="w-full flex items-center justify-center space-x-2 mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Business</span>
            </Button>
          </div>

          {/* Educational Institutions */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <GraduationCap className="w-4 h-4 mr-2" />
              Educational Institutions
            </h4>
            {institutions.length === 0 ? (
              <div className="text-gray-400 text-sm mb-3">No institutions yet.</div>
            ) : (
              <div className="space-y-3 mb-3">
                {institutions.map((institution) => (
                  <div
                    key={institution.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSwitchToInstitution(institution)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {institution.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getInstitutionTypeDisplay(institution.type)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRoleDisplayName(getInstitutionUserRole(institution))} • {institution.members.length} members
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="secondary"
              onClick={handleCreateInstitution}
              className="w-full flex items-center justify-center space-x-2 mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Institution</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
} 