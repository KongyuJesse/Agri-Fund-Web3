import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterFarmer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('individual');
  const [numMembers, setNumMembers] = useState(2);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    sex: '',
    dob: '',
    occupation: '',
    education: '',
    address: '',
    bio: '',
    photo: null,
    idDoc: null,
    supportingDocs: [],
    country: '',
    groupName: '',
    members: [],
  });

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const idDocInputRef = useRef(null);

  const isValidFile = (file) => {
    if (!file) return false;
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  };

  const handleChange = (e, index = null) => {
    const { name, value, files } = e.target;

    if (index !== null) {
      const updatedMembers = [...formData.members];
      if (name === 'photo') {
        const file = files[0];
        updatedMembers[index][name] = file;

        const newPreviews = [...photoPreviews];
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews[index] = reader.result;
          setPhotoPreviews(newPreviews);
        };
        if (file) reader.readAsDataURL(file);
      } else if (name === 'idDoc') {
        updatedMembers[index][name] = files[0];
      } else {
        updatedMembers[index][name] = value;
      }
      setFormData({ ...formData, members: updatedMembers });
    } else {
      if (name === 'photo') {
        const file = files[0];
        setFormData((prev) => ({ ...prev, photo: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviews([reader.result]);
        };
        if (file) reader.readAsDataURL(file);
      } else if (name === 'idDoc') {
        setFormData({ ...formData, idDoc: files[0] });
      } else if (name === 'supportingDocs') {
        setFormData({ ...formData, supportingDocs: files });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleNext = (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;

    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      alert(
        'Password must be at least 8 characters long and include uppercase, lowercase, and symbols.'
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (accountType === 'group') {
      const count = Math.max(2, parseInt(numMembers));
      const members = Array.from({ length: count }, () => ({
        name: '',
        sex: '',
        dob: '',
        photo: null,
        idDoc: null,
        occupation: '',
        education: '',
        address: '',
        bio: '',
      }));
      setFormData({ ...formData, members });
      setPhotoPreviews(Array(count).fill(null));
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = new FormData();

    for (const key in formData) {
      if (key === 'supportingDocs') {
        Array.from(formData.supportingDocs).forEach((file) => {
          if (!isValidFile(file)) {
            alert('Invalid supporting document or file too large.');
            setIsSubmitting(false);
            return;
          }
          payload.append('supportingDocs', file);
        });
      } else if (key === 'members') {
        formData.members.forEach((member, index) => {
          if (!isValidFile(member.photo) || !isValidFile(member.idDoc)) {
            alert(`Invalid file for member ${index + 1}`);
            setIsSubmitting(false);
            return;
          }
          Object.entries(member).forEach(([k, v]) => {
            payload.append(`members[${index}][${k}]`, v);
          });
        });
      } else if (key === 'photo' || key === 'idDoc') {
        if (!isValidFile(formData[key])) {
          alert('Invalid photo or ID document.');
          setIsSubmitting(false);
          return;
        }
        payload.append(key, formData[key]);
      } else if (key !== 'confirmPassword') {
        payload.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch('/api/auth/register-farmer', {
        method: 'POST',
        body: payload,
      });
      const result = await res.json();
      
      if (res.ok) {
        alert('Registration successful! Your account is pending admin approval. You will receive an email notification once your account is approved.');
        navigate('/login');
      } else {
        alert(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      alert('An error occurred during registration. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="absolute top-6 left-6 text-white text-2xl font-bold tracking-wide">
        <span className="text-blue-400">🌾</span> AGRI-FUND
      </div>

      {step === 1 && (
        <form
          onSubmit={handleNext}
          className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6 border border-blue-700"
        >
          <h2 className="text-3xl font-bold text-center text-blue-400 mb-2">Register Farmer</h2>
          <p className="text-gray-400 text-center mb-6">Create your Agri-Fund Farmer account</p>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => navigate('/register')}
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium text-white border border-gray-600 transition"
            >
              NGO Registration
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white border border-blue-500"
              disabled
            >
              Farmer Registration
            </button>
          </div>

          <div className="flex justify-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input 
                type="radio" 
                value="individual" 
                checked={accountType === 'individual'} 
                onChange={() => setAccountType('individual')} 
                className="text-blue-500 focus:ring-blue-500"
              /> 
              Individual
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <input 
                type="radio" 
                value="group" 
                checked={accountType === 'group'} 
                onChange={() => setAccountType('group')} 
                className="text-blue-500 focus:ring-blue-500"
              /> 
              Group
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                onChange={handleChange}
                value={formData.email}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition pr-12"
                  onChange={handleChange}
                  value={formData.password}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-blue-400 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 8 characters with uppercase, lowercase, and symbols.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition pr-12"
                  onChange={handleChange}
                  value={formData.confirmPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-blue-400 transition"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {accountType === 'group' && (
              <div>
                <label htmlFor="numMembers" className="block text-sm font-medium text-gray-300 mb-1">
                  Number of Group Members (minimum 2)
                </label>
                <input
                  type="number"
                  id="numMembers"
                  min="2"
                  value={numMembers}
                  onChange={(e) => setNumMembers(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 transition-colors"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-colors duration-300"
          >
            Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6 border border-blue-700"
          encType="multipart/form-data"
        >
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          <h2 className="text-2xl font-bold text-blue-400 mb-4">
            {accountType === 'group' ? 'Group Farmer Details' : 'Farmer Details'}
          </h2>
          <p className="text-gray-400 mb-6">
            {accountType === 'group' 
              ? 'Please provide your group details and member information' 
              : 'Please provide your personal details for verification'}
          </p>

          {accountType === 'group' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    name="groupName"
                    required
                    placeholder="Your group name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    onChange={handleChange}
                    value={formData.groupName}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    placeholder="Country of operation"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                    onChange={handleChange}
                    value={formData.country}
                  />
                </div>
              </div>

              {formData.members.map((member, index) => (
                <div key={index} className="border-t border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Member {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor={`member-name-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id={`member-name-${index}`}
                        name="name"
                        required
                        placeholder="Member full name"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.name}
                      />
                    </div>

                    <div>
                      <label htmlFor={`member-sex-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Sex
                      </label>
                      <select
                        id={`member-sex-${index}`}
                        name="sex"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.sex}
                      >
                        <option value="">Select sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`member-dob-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id={`member-dob-${index}`}
                        name="dob"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.dob}
                      />
                    </div>

                    <div>
                      <label htmlFor={`member-country-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        id={`member-country-${index}`}
                        name="country"
                        required
                        placeholder="Country"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.country}
                      />
                    </div>

                    <div>
                      <label htmlFor={`member-occupation-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Occupation
                      </label>
                      <input
                        type="text"
                        id={`member-occupation-${index}`}
                        name="occupation"
                        required
                        placeholder="Occupation"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.occupation}
                      />
                    </div>

                    <div>
                      <label htmlFor={`member-education-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Education Level
                      </label>
                      <input
                        type="text"
                        id={`member-education-${index}`}
                        name="education"
                        required
                        placeholder="Education level"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.education}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor={`member-address-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        id={`member-address-${index}`}
                        name="address"
                        required
                        placeholder="Physical address"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.address}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor={`member-bio-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        id={`member-bio-${index}`}
                        name="bio"
                        rows={3}
                        placeholder="Brief bio about this member"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        onChange={(e) => handleChange(e, index)}
                        value={member.bio}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Member Photo (Max 5MB)
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => document.getElementById(`member-photo-${index}`).click()}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition border border-blue-500"
                        >
                          Upload Photo
                        </button>
                        <span className="text-gray-300 text-sm">
                          {member.photo ? member.photo.name : 'No file selected'}
                        </span>
                      </div>
                      <input
                        type="file"
                        id={`member-photo-${index}`}
                        name="photo"
                        accept="image/*"
                        required
                        onChange={(e) => handleChange(e, index)}
                        className="hidden"
                      />
                      {photoPreviews[index] && (
                        <img src={photoPreviews[index]} alt="preview" className="mt-2 h-24 rounded" />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        ID Document (PDF, JPG, PNG)
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => document.getElementById(`member-idDoc-${index}`).click()}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition border border-blue-500"
                        >
                          Upload ID
                        </button>
                        <span className="text-gray-300 text-sm">
                          {member.idDoc ? member.idDoc.name : 'No file selected'}
                        </span>
                      </div>
                      <input
                        type="file"
                        id={`member-idDoc-${index}`}
                        name="idDoc"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        onChange={(e) => handleChange(e, index)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.name}
                />
              </div>

              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-300 mb-1">
                  Sex
                </label>
                <select
                  id="sex"
                  name="sex"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.sex}
                >
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.dob}
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  placeholder="Your country"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.country}
                />
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-300 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  required
                  placeholder="Your occupation"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.occupation}
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-300 mb-1">
                  Education Level
                </label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  required
                  placeholder="Your education level"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.education}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  placeholder="Your physical address"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.address}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  placeholder="Tell us about yourself"
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  onChange={handleChange}
                  value={formData.bio}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo (Max 5MB)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current.click()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition border border-blue-500"
                  >
                    Upload Photo
                  </button>
                  <span className="text-gray-300 text-sm">
                    {formData.photo ? formData.photo.name : 'No file selected'}
                  </span>
                </div>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  required
                  onChange={handleChange}
                  ref={photoInputRef}
                  className="hidden"
                />
                {photoPreviews[0] && (
                  <img src={photoPreviews[0]} alt="preview" className="mt-2 h-24 rounded" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID Document (PDF, JPG, PNG)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => idDocInputRef.current.click()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition border border-blue-500"
                  >
                    Upload ID
                  </button>
                  <span className="text-gray-300 text-sm">
                    {formData.idDoc ? formData.idDoc.name : 'No file selected'}
                  </span>
                </div>
                <input
                  type="file"
                  name="idDoc"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  onChange={handleChange}
                  ref={idDocInputRef}
                  className="hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Supporting Documents (PDF, DOCX, JPG, PNG)
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition border border-blue-500"
              >
                Upload Files
              </button>
              <span className="text-gray-300 text-sm">
                {formData.supportingDocs.length > 0 
                  ? `${formData.supportingDocs.length} file(s) selected` 
                  : 'No files selected'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Upload any additional supporting documents (land ownership, farming certificates, etc.)
            </p>
            <input
              type="file"
              name="supportingDocs"
              accept=".pdf,.doc,.docx,.jpg,.png"
              multiple
              onChange={handleChange}
              ref={fileInputRef}
              className="hidden"
            />
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-6">
            <h3 className="text-blue-400 font-semibold mb-2">Verification Process</h3>
            <p className="text-sm text-gray-300">
              After submission, your account will be reviewed by our admin team. 
              This verification process typically takes 3-5 business days. 
              You'll receive an email notification once your account is approved.
            </p>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}