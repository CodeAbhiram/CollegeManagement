import React, { useState, useEffect } from "react";
import { FiLogIn } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserToken } from "../redux/actions";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";

/**
 * DEV NOTE:
 * Set DEV_BYPASS_ADMIN = true only for local/dev testing.
 * NEVER enable this in production.
 */
const DEV_BYPASS_ADMIN = true;

const USER_TYPES = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Admin",
};

const LoginForm = ({ selected, onSubmit, formData, setFormData }) => (
  <form
    className="w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-200"
    onSubmit={onSubmit}
  >
    <div className="mb-6">
      <label className="block text-gray-800 text-sm font-medium mb-2" htmlFor="email">
        {selected} Email
      </label>
      <input
        type="email"
        id="email"
        required
        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>

    <div className="mb-6">
      <label className="block text-gray-800 text-sm font-medium mb-2" htmlFor="password">
        Password
      </label>
      <input
        type="password"
        id="password"
        required
        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
    </div>

    <div className="flex items-center justify-between mb-6">
      <Link className="text-sm text-blue-600 hover:underline" to="/forget-password">
        Forgot Password?
      </Link>
    </div>

    <CustomButton
      type="submit"
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 flex justify-center items-center gap-2"
    >
      Login
      <FiLogIn className="text-lg" />
    </CustomButton>
  </form>
);

const UserTypeSelector = ({ selected, onSelect }) => (
  <div className="flex justify-center gap-4 mb-8">
    {Object.values(USER_TYPES).map((type) => (
      <button
        key={type}
        onClick={() => onSelect(type)}
        className={`px-5 py-2 text-sm font-medium rounded-full transition duration-200 ${
          selected === type ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        {type}
      </button>
    ))}
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryType = searchParams.get("type");

  const [selected, setSelected] = useState(USER_TYPES.STUDENT);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryType) {
      const capitalized = queryType.charAt(0).toUpperCase() + queryType.slice(1);
      if (Object.values(USER_TYPES).includes(capitalized)) setSelected(capitalized);
    }
  }, [queryType]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userType = localStorage.getItem("userType");
    if (token && userType) {
      navigate(`/${userType.toLowerCase()}`);
    }
  }, [navigate]);

  const handleUserTypeSelect = (type) => {
    setSelected(type);
    setSearchParams({ type: type.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    // ===== DEV BYPASS FOR ADMIN =====
    if (DEV_BYPASS_ADMIN && selected === USER_TYPES.ADMIN) {
      // Warning: this bypass is ONLY for development/testing.
      const fakeToken = "dev-admin-bypass-token";
      localStorage.setItem("userToken", fakeToken);
      localStorage.setItem("userType", USER_TYPES.ADMIN);
      dispatch(setUserToken(fakeToken));
      toast.success("Admin bypassed (DEV). Redirecting to admin dashboard...");
      navigate("/admin");
      return;
    }

    // ===== Normal login flow for other users (and Admin if bypass disabled) =====
    setLoading(true);
    try {
      const res = await axiosWrapper.post(`/${selected.toLowerCase()}/login`, formData);

      // Flexible extraction: support both { token } and { data: { token } } backend shapes
      const token = res?.data?.data?.token || res?.data?.token || res?.token;
      const message = res?.data?.message || res?.message;

      if (!token) {
        toast.error(message || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("userToken", token);
      localStorage.setItem("userType", selected);
      dispatch(setUserToken(token));
      toast.success("Login successful");
      navigate(`/${selected.toLowerCase()}`);
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl lg:w-1/2 px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">{selected} Login</h1>

        <UserTypeSelector selected={selected} onSelect={handleUserTypeSelect} />

        <LoginForm selected={selected} onSubmit={handleSubmit} formData={formData} setFormData={setFormData} />

        <div className="mt-4 text-center text-sm text-gray-600">
          {DEV_BYPASS_ADMIN && selected === USER_TYPES.ADMIN ? (
            <span className="text-red-600">Dev bypass enabled — admin auth skipped</span>
          ) : (
            <span>Make sure you have the correct credentials.</span>
          )}
        </div>
      </div>

      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;
