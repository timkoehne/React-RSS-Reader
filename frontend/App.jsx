import React from 'react';
import { createBrowserRouter, RouterProvider, } from "react-router-dom";
import Settings from './routes/Settings';
import ErrorPage from './routes/ErrorPage';
import MainPage from './routes/MainPage';

const router = createBrowserRouter([

  {
    path: "/",
    element: <MainPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/settings",
    element: <Settings />,
    errorElement: <ErrorPage />,
  }
]);

export default function App({ routes }) {

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
