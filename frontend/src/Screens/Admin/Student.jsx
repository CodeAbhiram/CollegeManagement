import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import Heading from "../../components/Heading";
import DeleteConfirm from "../../components/DeleteConfirm";
import axiosWrapper from "../../utils/AxiosWrapper";
import CustomButton from "../../components/CustomButton";
import NoData from "../../components/NoData";
import { CgDanger } from "react-icons/cg";

const Student = () => {
  const userToken = localStorage.getItem("userToken");

  // States
  const [searchParams, setSearchParams] = useState({ enrollmentNo: "", name: "", semester: "", branch: "" });
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    semester: "",
    branchId: "",
    gender: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    bloodGroup: "",
    emergencyContact: { name: "", relationship: "", phone: "" },
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch branches
  const fetchBranches = async () => {
    try {
      toast.loading("Loading branches...");
      const res = await axiosWrapper.get("/branch", { headers: { Authorization: `Bearer ${userToken}` } });
      toast.dismiss();
      if (res.data.success) setBranches(res.data.data);
      else toast.error(res.data.message);
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to load branches");
    }
  };

  // Fetch students
  const fetchStudents = async (params) => {
    setLoading(true);
    try {
      const payload = {};
      Object.keys(params).forEach((k) => { if (params[k]) payload[k] = params[k]; });
      const res = await axiosWrapper.post("/student/search", payload, { headers: { Authorization: `Bearer ${userToken}` } });
      if (res.data.success) setStudents(res.data.data);
      else setStudents([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error searching students");
      setStudents([]);
    } finally { setLoading(false); }
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!Object.values(searchParams).some((val) => val)) return toast.error("Please select at least one filter");
    fetchStudents(searchParams);
  };

  // Form input handlers
  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleEmergencyChange = (field, value) => setFormData((prev) => ({
    ...prev,
    emergencyContact: { ...prev.emergencyContact, [field]: value },
  }));

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) setPreviewImage(URL.createObjectURL(selectedFile));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: "", middleName: "", lastName: "", phone: "", semester: "", branchId: "", gender: "",
      dob: "", address: "", city: "", state: "", pincode: "", country: "", bloodGroup: "",
      emergencyContact: { name: "", relationship: "", phone: "" },
    });
    setFile(null);
    setPreviewImage(null);
    setShowForm(false);
    setIsEditing(false);
    setSelectedStudentId(null);
  };

  // Add/Edit student
  const submitStudent = async () => {
    try {
      toast.loading(isEditing ? "Updating student..." : "Adding student...");
      const headers = { "Content-Type": "multipart/form-data", Authorization: `Bearer ${userToken}` };
      const dataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "emergencyContact") {
          Object.keys(formData.emergencyContact).forEach((subKey) =>
            dataToSend.append(`emergencyContact[${subKey}]`, formData.emergencyContact[subKey])
          );
        } else dataToSend.append(key, formData[key]);
      });

      if (file) dataToSend.append("file", file);

      let res;
      if (isEditing) res = await axiosWrapper.patch(`/student/${selectedStudentId}`, dataToSend, { headers });
      else res = await axiosWrapper.post("/student/register", dataToSend, { headers });

      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || (isEditing ? "Student updated!" : "Student added!"));
        // Update local state instead of refetching
        if (isEditing) {
          setStudents((prev) => prev.map((s) => s._id === selectedStudentId ? res.data.data : s));
        } else {
          setStudents((prev) => [res.data.data, ...prev]);
        }
        resetForm();
      } else toast.error(res.data.message);
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Error");
    }
  };

  // Edit handler
  const editStudent = (student) => {
    setFormData({
      firstName: student.firstName || "", middleName: student.middleName || "", lastName: student.lastName || "",
      phone: student.phone || "", semester: student.semester || "", branchId: student.branchId?._id || "",
      gender: student.gender || "", dob: student.dob?.split("T")[0] || "", address: student.address || "",
      city: student.city || "", state: student.state || "", pincode: student.pincode || "", country: student.country || "",
      bloodGroup: student.bloodGroup || "", emergencyContact: {
        name: student.emergencyContact?.name || "", relationship: student.emergencyContact?.relationship || "",
        phone: student.emergencyContact?.phone || "",
      },
    });
    setPreviewImage(student.profile ? `${process.env.REACT_APP_MEDIA_LINK}/${student.profile}` : null);
    setSelectedStudentId(student._id);
    setIsEditing(true);
    setShowForm(true);
  };

  // Delete handler
  const confirmDelete = async () => {
    try {
      toast.loading("Deleting student...");
      const res = await axiosWrapper.delete(`/student/${selectedStudentId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success("Student deleted!");
        setStudents((prev) => prev.filter((s) => s._id !== selectedStudentId));
        setDeleteConfirmOpen(false);
      } else toast.error(res.data.message);
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="w-full mx-auto mt-10 flex flex-col items-center mb-10">
      <div className="flex justify-between items-center w-full">
        <Heading title="Student Management" />
        {branches.length > 0 && <CustomButton onClick={() => setShowForm(true)}><IoMdAdd className="text-2xl" /></CustomButton>}
      </div>

      {branches.length > 0 ? (
        <>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="my-6 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            <input placeholder="Enrollment No" name="enrollmentNo" value={searchParams.enrollmentNo} onChange={(e) => setSearchParams(prev => ({...prev, enrollmentNo: e.target.value}))} />
            <input placeholder="Name" name="name" value={searchParams.name} onChange={(e) => setSearchParams(prev => ({...prev, name: e.target.value}))} />
            <select name="semester" value={searchParams.semester} onChange={(e) => setSearchParams(prev => ({...prev, semester: e.target.value}))}>
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="branch" value={searchParams.branch} onChange={(e) => setSearchParams(prev => ({...prev, branch: e.target.value}))}>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <CustomButton type="submit" disabled={loading}>{loading ? "Searching..." : "Search"}</CustomButton>
          </form>

          {students.length === 0 ? <NoData title="No students found" /> : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {["Profile","Name","E. No","Semester","Branch","Email","Actions"].map(h => <th key={h} className="px-6 py-3 border-b">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><img src={previewImage || "https://images.unsplash.com/photo-1744315900478-fa44dc6a4e89?q=80&w=3087"} alt="" className="w-12 h-12 rounded-full object-cover" /></td>
                      <td>{`${s.firstName} ${s.middleName} ${s.lastName}`}</td>
                      <td>{s.enrollmentNo}</td>
                      <td>{s.semester}</td>
                      <td>{s.branchId?.name}</td>
                      <td>{s.email}</td>
                      <td className="flex justify-center gap-2">
                        <CustomButton variant="secondary" onClick={() => editStudent(s)}><MdEdit /></CustomButton>
                        <CustomButton variant="danger" onClick={() => {setSelectedStudentId(s._id); setDeleteConfirmOpen(true)}}><MdOutlineDelete /></CustomButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center mt-24"><CgDanger className="w-16 h-16 text-yellow-500 mb-4" /><p>Please add branches before adding students.</p></div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button onClick={resetForm} className="absolute top-4 right-4"><IoMdClose className="text-2xl" /></button>
            <h2 className="text-2xl mb-4">{isEditing ? "Edit Student" : "Add Student"}</h2>
            <form onSubmit={(e) => {e.preventDefault(); submitStudent();}}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["firstName","middleName","lastName","phone","semester","branchId","gender","dob","bloodGroup","address","city","state","pincode","country"].map(f => (
                  <div key={f}>
                    <label>{f}</label>
                    <input type={f==="dob"?"date":"text"} value={formData[f]} onChange={(e) => handleFormChange(f,e.target.value)} />
                  </div>
                ))}
                <div>
                  <label>Profile Photo</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                  {previewImage && <img src={previewImage} alt="Preview" className="w-24 h-24 mt-2 rounded-full object-cover" />}
                </div>
                <div className="md:col-span-2">
                  <h3>Emergency Contact</h3>
                  {["name","relationship","phone"].map(f => (
                    <input key={f} placeholder={f} value={formData.emergencyContact[f]} onChange={(e)=>handleEmergencyChange(f,e.target.value)} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <CustomButton type="button" variant="secondary" onClick={resetForm}>Cancel</CustomButton>
                <CustomButton type="submit" variant="primary">{isEditing?"Update":"Add"}</CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <DeleteConfirm isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} onConfirm={confirmDelete} message="Are you sure you want to delete this student?" />
    </div>
  );
};

export default Student;
