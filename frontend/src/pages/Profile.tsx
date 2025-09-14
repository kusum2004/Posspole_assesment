import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ProfileFormData, ChangePasswordData } from '../types';
import { profileSchema, changePasswordSchema } from '../utils/validation';
import { userApi, authApi } from '../utils/api';
import { formatDate, formatDateForInput, generateInitials, validateFile } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import Layout from '../components/layout/Layout';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema) as any,
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      dateOfBirth: user?.dateOfBirth ? formatDateForInput(user.dateOfBirth) : '',
      address: user?.address || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordData>({
    resolver: yupResolver(changePasswordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const updatedUser = await userApi.updateProfile(data);
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data: ChangePasswordData) => {
    try {
      await authApi.changePassword(data);
      toast.success('Password changed successfully!');
      setIsPasswordModalOpen(false);
      resetPassword();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error!);
      return;
    }

    handleImageUpload(file);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const imageUrl = await userApi.uploadProfilePicture(file);
      if (user) {
        const updatedUser = { ...user, profilePicture: imageUrl };
        updateUser(updatedUser);
      }
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload image';
      toast.error(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      await userApi.deleteProfilePicture();
      if (user) {
        const updatedUser = { ...user, profilePicture: null };
        updateUser(updatedUser);
      }
      toast.success('Profile picture deleted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete profile picture';
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account information and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border border-gray-300">
                        <span className="text-2xl font-bold text-primary-600">
                          {generateInitials(user.name)}
                        </span>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                        <LoadingSpinner size="small" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="btn-primary text-sm"
                    >
                      {user.profilePicture ? 'Change Picture' : 'Upload Picture'}
                    </button>
                    {user.profilePicture && (
                      <button
                        onClick={handleDeleteProfilePicture}
                        disabled={uploadingImage}
                        className="btn-danger text-sm w-full"
                      >
                        Delete Picture
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <p className="mt-3 text-xs text-gray-500 text-center">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Account Info */}
              <div className="card mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="text-sm text-gray-900 capitalize">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                    <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                  </div>
                  {user.lastLogin && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user.lastLogin)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Profile Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      {...registerProfile('name')}
                      type="text"
                      className={`input-field ${profileErrors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...registerProfile('phoneNumber')}
                      type="tel"
                      className={`input-field ${profileErrors.phoneNumber ? 'border-red-500' : ''}`}
                      placeholder="Enter your phone number"
                    />
                    {profileErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      {...registerProfile('dateOfBirth')}
                      type="date"
                      className={`input-field ${profileErrors.dateOfBirth ? 'border-red-500' : ''}`}
                    />
                    {profileErrors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.dateOfBirth.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      {...registerProfile('address')}
                      rows={3}
                      className={`input-field resize-none ${profileErrors.address ? 'border-red-500' : ''}`}
                      placeholder="Enter your address"
                    />
                    {profileErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.address.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="small" className="mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Settings */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Password</h4>
                      <p className="text-sm text-gray-600">Last changed on {formatDate(user.updatedAt)}</p>
                    </div>
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="btn-secondary text-sm"
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      disabled
                      className="btn-secondary text-sm opacity-50 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card border-red-200">
                <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    disabled
                    className="mt-3 btn-danger text-sm opacity-50 cursor-not-allowed"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          resetPassword();
        }}
        title="Change Password"
        size="medium"
      >
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <input
              {...registerPassword('currentPassword')}
              type="password"
              className={`input-field ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
              placeholder="Enter your current password"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <input
              {...registerPassword('newPassword')}
              type="password"
              className={`input-field ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
              placeholder="Enter your new password"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <input
              {...registerPassword('confirmNewPassword')}
              type="password"
              className={`input-field ${passwordErrors.confirmNewPassword ? 'border-red-500' : ''}`}
              placeholder="Confirm your new password"
            />
            {passwordErrors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains at least 1 special character</li>
              <li>• Contains at least 1 number</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                resetPassword();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Change Password
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Profile;
