import React, { useState, useEffect } from "react";
import { FiLogIn } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserToken } from "../redux/actions";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";

const USER_TYPES = ["Student", "Faculty", "Admin"];

const UserTypeSelector = ({ selected, onSelect }) => (
  <div className="flex justify-center gap-4 mb-8">
    {USER_TYPES.map((type) => (
      <button
        key={type}
        onClick={() => onSelect(type)}
        className={`px-5 py-2 text-sm font-medium rounded-full transition duration-200 ${
          selected === type
            ? "bg-blue-600 text-white shadow"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        {type}
      </button>
    ))}
  </div>
);

const LoginForm = ({ selected, formData, setFormData, onSubmit }) => (
  <form
    className="w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-200"
    onSubmit={onSubmit}
  >
    <div className="mb-6">
      <label className="block text-gray-800 text-sm font-medium mb-2">
        {selected} Email
      </label>
      <input
        type="email"
        required
        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>
    <div className="mb-6">
      <label className="block text-gray-800 text-sm font-medium mb-2">
        Password
      </label>
      <input
        type="password"
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

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryType = searchParams.get("type");

  const [selected, setSelected] = useState("Student");
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Update user type from query params if available
  useEffect(() => {
    if (queryType) {
      const capitalized = queryType.charAt(0).toUpperCase() + queryType.slice(1);
      if (USER_TYPES.includes(capitalized)) setSelected(capitalized);
    }
  }, [queryType]);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userType = localStorage.getItem("userType");
    if (token && userType) navigate(`/${userType.toLowerCase()}`);
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

    try {
      const { data } = await axiosWrapper.post(
        `/${selected.toLowerCase()}/login`,
        formData
      );

      if (!data || !data.token) {
        toast.error(data?.message || "Login failed");
        return;
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userType", selected);
      dispatch(setUserToken(data.token));
      navigate(`/${selected.toLowerCase()}`);
      toast.success("Login successful!");
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl lg:w-1/2 px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
          {selected} Login
        </h1>
        <UserTypeSelector selected={selected} onSelect={handleUserTypeSelect} />
        <LoginForm
          selected={selected}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;
