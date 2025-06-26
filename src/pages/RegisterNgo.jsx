import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterNgo() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    ngoName: '',
    country: '',
    dateFounded: '',
    address: '',
    about: '',
    mission: '',
    legalDocs: null,
  });

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'legalDocs') {
      setFormData((prev) => ({ ...prev, legalDocs: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = new FormData();
    for (const key in formData) {
      if (key !== 'confirmPassword') {
        payload.append(key, formData[key]);
      }
    }

    try {
      const res = await fetch('/api/auth/register-ngo', {
        method: 'POST',
        body: payload,
      });
      const result = await res.json();
      
      if (res.ok) {
        alert('Registration successful! Your account is pending admin approval. This process may take up to 5 business days. You will receive an email notification once your account is approved.');
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
          <h2 className="text-3xl font-bold text-center text-blue-400 mb-2">Register NGO</h2>
          <p className="text-gray-400 text-center mb-6">Create your Agri-Fund NGO account</p>

          <div className="flex justify-center gap-4 mb-6">
            <button
              type="button"
              className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white border border-blue-500"
              disabled
            >
              NGO Registration
            </button>
            <button
              onClick={() => navigate('/register/farmer')}
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium text-white border border-gray-600 transition"
            >
              Farmer Registration
            </button>
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

          <h2 className="text-2xl font-bold text-blue-400 mb-4">NGO Details</h2>
          <p className="text-gray-400 mb-6">Please provide your organization's details for verification</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ngoName" className="block text-sm font-medium text-gray-300 mb-1">
                NGO Name
              </label>
              <input
                type="text"
                id="ngoName"
                name="ngoName"
                required
                placeholder="Organization name"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                onChange={handleChange}
                value={formData.ngoName}
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

            <div>
              <label htmlFor="dateFounded" className="block text-sm font-medium text-gray-300 mb-1">
                Date Founded
              </label>
              <input
                type="date"
                id="dateFounded"
                name="dateFounded"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                onChange={handleChange}
                value={formData.dateFounded}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                placeholder="Physical address"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                onChange={handleChange}
                value={formData.address}
              />
            </div>
          </div>

          <div>
            <label htmlFor="about" className="block text-sm font-medium text-gray-300 mb-1">
              About
            </label>
            <textarea
              id="about"
              name="about"
              required
              rows={3}
              placeholder="Brief description of your NGO"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              onChange={handleChange}
              value={formData.about}
            />
          </div>

          <div>
            <label htmlFor="mission" className="block text-sm font-medium text-gray-300 mb-1">
              Mission Statement
            </label>
            <textarea
              id="mission"
              name="mission"
              required
              rows={3}
              placeholder="Your organization's mission"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              onChange={handleChange}
              value={formData.mission}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Legal Documents (PDF, DOCX, JPG, PNG)
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition border border-blue-500"
              >
                Upload File
              </button>
              <span className="text-gray-300 text-sm">
                {formData.legalDocs ? formData.legalDocs.name : 'No file selected'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Upload your NGO's registration certificate or other legal documents for verification.
            </p>
            <input
              type="file"
              name="legalDocs"
              accept=".pdf,.doc,.docx,.jpg,.png"
              required
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