import React, { useState, useEffect } from "react";
import axios from "axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    country: "",
    currency: ""
  });

  const [countries, setCountries] = useState([]);

  // Fetch countries & currencies
  useEffect(() => {
    axios
      .get("https://restcountries.com/v3.1/all?fields=name,currencies")
      .then((res) => {
        const countryList = res.data.map((c) => {
          const currencyCode = c.currencies
            ? Object.keys(c.currencies)[0]
            : "";
          return {
            name: c.name.common,
            currency: currencyCode
          };
        });
        setCountries(countryList);
      });
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle country selection
  const handleCountryChange = (e) => {
    const selected = countries.find(
      (c) => c.name === e.target.value
    );

    setFormData({
      ...formData,
      country: selected.name,
      currency: selected.currency
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/signup",
        formData
      );

      alert("Signup successful!");
      console.log(response.data);

    } catch (error) {
      alert("Error during signup");
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h2>Create Company Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          onChange={handleChange}
          required
        />

        <h3>Company Details</h3>

        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          onChange={handleChange}
          required
        />

        <select onChange={handleCountryChange} required>
          <option value="">Select Country</option>
          {countries.map((c, index) => (
            <option key={index} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="currency"
          value={formData.currency}
          placeholder="Currency"
          readOnly
        />

        <button type="submit">Create Company & Admin</button>
      </form>
    </div>
  );
};

export default Signup;