import React from 'react'
import { Route,BrowserRouter,Routes } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>}></Route>
        <Route path="/login" element={<div>login</div>}></Route>
        <Route path="/register" element={<div>register</div>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes