"use client";

import {useState} from "react";


export default function Signup() {
  return(
     <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form 
        onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"

        >
            <h2>
                FocusTracker Signup
            </h2>
            
        </form>



     </div>
  );

}