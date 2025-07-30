import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MenuSidebar from "../components/MenuSidebar";

export default class BasePage extends React.Component {
  renderContent() {
    throw new Error("renderContent() precisa ser implementado pela subclasse.");
  }

  render() {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <MenuSidebar />
        <main className="content-with-sidebar flex-grow-1 py-4">
          {this.renderContent()}
        </main>
        <Footer />
      </div>
    );
  }
}
