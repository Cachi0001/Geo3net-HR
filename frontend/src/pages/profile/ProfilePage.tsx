import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { Button, Input } from '../../components/common';
import { useToast } from '../../hooks/useToast';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { addToast } = useToast();

  const profileForm = useForm({
    initialValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
    onSubmit: async (values) => {
      try {
        await updateProfile({ fullName: values.fullName });
        addToast({ type: 'success', message: 'Profile updated successfully!' });
      } catch (error) {
        addToast({ type: 'error', message: 'Failed to update profile.' });
        console.error(error);
      }
    },
  });

  const passwordForm = useForm({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationRules: {
      oldPassword: { required: true },
      newPassword: { required: true, minLength: 8 },
      confirmPassword: {
        required: true,
        custom: (value, values) => value !== values.newPassword ? 'Passwords do not match' : null,
      },
    },
    onSubmit: async (values, { reset }) => {
      try {
        await changePassword(values.oldPassword, values.newPassword);
        addToast({ type: 'success', message: 'Password changed successfully!' });
        reset();
      } catch (error) {
        addToast({ type: 'error', message: 'Failed to change password. Check your old password.' });
        console.error(error);
      }
    },
  });

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <h1 className="profile-page__title">My Profile</h1>
      </header>

      {/* Profile Information Card */}
      <div className="profile-page__card">
        <header className="profile-page__card-header">
          <h2 className="profile-page__card-title">Profile Information</h2>
        </header>
        <div className="profile-page__card-body">
          <form onSubmit={profileForm.handleSubmit}>
            <div className="profile-form__group">
              <label htmlFor="fullName" className="profile-form__label">Full Name</label>
              <Input
                id="fullName"
                name="fullName"
                value={profileForm.values.fullName}
                onChange={profileForm.handleChange}
                className="profile-form__input"
              />
            </div>
            <div className="profile-form__group">
              <label htmlFor="email" className="profile-form__label">Email Address</label>
              <Input
                id="email"
                name="email"
                value={profileForm.values.email}
                className="profile-form__input"
                disabled
              />
            </div>
            <div className="profile-form__actions">
              <Button type="submit" variant="primary" disabled={profileForm.isSubmitting}>
                {profileForm.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="profile-page__card">
        <header className="profile-page__card-header">
          <h2 className="profile-page__card-title">Change Password</h2>
        </header>
        <div className="profile-page__card-body">
          <form onSubmit={passwordForm.handleSubmit}>
            <div className="profile-form__group">
              <label htmlFor="oldPassword" className="profile-form__label">Old Password</label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={passwordForm.values.oldPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                className="profile-form__input"
              />
              {passwordForm.touched.oldPassword && passwordForm.errors.oldPassword && (
                <p className="profile-form__error">{passwordForm.errors.oldPassword}</p>
              )}
            </div>
            <div className="profile-form__group">
              <label htmlFor="newPassword" className="profile-form__label">New Password</label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.values.newPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                className="profile-form__input"
              />
              {passwordForm.touched.newPassword && passwordForm.errors.newPassword && (
                <p className="profile-form__error">{passwordForm.errors.newPassword}</p>
              )}
            </div>
            <div className="profile-form__group">
              <label htmlFor="confirmPassword" className="profile-form__label">Confirm New Password</label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.values.confirmPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                className="profile-form__input"
              />
              {passwordForm.touched.confirmPassword && passwordForm.errors.confirmPassword && (
                <p className="profile-form__error">{passwordForm.errors.confirmPassword}</p>
              )}
            </div>
            <div className="profile-form__actions">
              <Button type="submit" variant="primary" disabled={passwordForm.isSubmitting}>
                {passwordForm.isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
