import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Home.module.css";
import FeaturedProducts from "../../components/FeaturedProducts/FeaturedProducts";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../../firebase_Config";
import { Link } from "react-router-dom";

function Home() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [seasonalProduce, setSeasonalProduce] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  const firstName = currentUser?.displayName?.split(" ")[0] || "Guest";
  const role = currentUser?.role;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured users
        const fetchUsers = async () => {
          try {
            // First try to get 4 users with profile images
            const usersQuery = query(
              collection(db, "users"),
              where("role", "in", ["retailer", "wholesaler"]),
              limit(4)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            let users = usersSnapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name || 'User',
              imageProfileUrl: doc.data().imageProfileUrl,
              role: doc.data().role
            }));

            // If we don't have 4 users with images, fill with users without images
            if (users.length < 4) {
              const remaining = 4 - users.length;
              const fallbackQuery = query(
                collection(db, "users"),
                where("role", "in", ["retailer", "wholesaler"]),
                where("imageProfileUrl", "==", null),
                limit(remaining)
              );
              const fallbackSnapshot = await getDocs(fallbackQuery);
              users = [
                ...users,
                ...fallbackSnapshot.docs.map(doc => ({
                  id: doc.id,
                  name: doc.data().name || 'User',
                  imageProfileUrl: null,
                  role: doc.data().role
                }))
              ];
            }

            setFeaturedUsers(users);
          } catch (error) {
            console.error("Error fetching featured users:", error);
            setFeaturedUsers([]);
          }
        };

        await fetchUsers();

        // Fetch seasonal produce
        const seasonalQuery = query(
          collection(db, "products"),
          where("isSeasonal", "==", true),
          limit(4)
        );
        const seasonalSnapshot = await getDocs(seasonalQuery);
        setSeasonalProduce(seasonalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch testimonials
        const testimonialsQuery = query(
          collection(db, "reviews"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const testimonialsSnapshot = await getDocs(testimonialsQuery);
        setTestimonials(testimonialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonLoading}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeletonItem}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Special Offer Banner */}
      <div className={styles.specialOffer}>
        <span className={styles.hotIcon}>🔥</span>
        Limited Time Offer! Get 15% off on your first order with code WELCOME15
      </div>

      {/* Personalized Welcome */}
      <h1 className={styles.welcomeMessage}>
        Welcome, <span className={styles.nameHighlight}>{firstName}</span>! {
          role === "retailer" ?
            <span className={styles.roleMessage}>Ready to stock up?</span> :
            role === "wholesaler" ?
              <span className={styles.roleMessage}>Ready to supply retailers?</span> :
              <span className={styles.roleMessage}>What are we cooking today?</span>
        }
      </h1>

      {/* Hero Section */}
      <section className={styles.hero}>
        <img
          src="https://res.cloudinary.com/dj5sf6jb3/image/upload/v1740743257/Img/homeimg.jpg"
          alt="Fresh Fruits and Vegetables"
          className={styles.heroImage}
          loading="lazy"
        />
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.textContainer}>
              <h2 className={styles.mainHeading}>
                <span className={styles.headingPart}>Fresh From Farm</span>
                {role === "retailer" ? (
                  <span className={styles.rolePart}>To Your Store</span>
                ) : role === "customer" ? (
                  <span className={styles.rolePart}>To Your Table</span>
                ) : (
                  <span className={styles.rolePart}>To Your Network</span>
                )}
              </h2>
              <p className={styles.subHeading}>
                {role === "retailer" ? (
                  "Source the highest quality produce for your business"
                ) : role === "customer" ? (
                  "Get farm-fresh produce delivered straight to your doorstep"
                ) : (
                  "Connect farmers with retailers in your distribution network"
                )}
              </p>
            </div>
            <Link 
              to={role === "wholesaler" ? "/inventory" : "/shop"}
              className={styles.ctaButton}
            >
              {role === "retailer" ? "Browse Wholesale" : role === "customer" ? "Shop Now" : "View Inventory"} 
              <span className={styles.ctaArrow}>→</span>
            </Link>
          </div>
        </div>
      </section>


      {/* Featured Products */}
      {(role === "customer" || role === "retailer") && <FeaturedProducts />}

      

        {/* How It Works Section */}
        <section className={styles.howItWorks}>
        <h2>How It Works</h2>
        <div className={styles.steps}>
          {role === "wholesaler" ? (
            <>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepIcon}>📊</div>
                <h3>Add & Update Products</h3>
                <p>Manage your inventory from the Products section</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepIcon}>📝</div>
                <h3>Manage Listings</h3>
                <p>View and edit your products in My Products section</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepIcon}>✔️</div>
                <h3>Process Orders</h3>
                <p>Accept or reject retailer orders in Orders section</p>
              </div>
            </>
          ) : role === "retailer" ? (
            <>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepIcon}>📊</div>
                <h3>Manage Your Store</h3>
                <p>Add products to your retail inventory</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepIcon}>🛒</div>
                <h3>Browse & Order</h3>
                <p>Select wholesale products from our catalog</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepIcon}>🚚</div>
                <h3>Receive Delivery</h3>
                <p>Get your order delivered within 24-48 hours</p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepIcon}>🛒</div>
                <h3>Select Items</h3>
                <p>Choose from fresh seasonal produce</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepIcon}>📦</div>
                <h3>Checkout</h3>
                <p>Select quantities and complete your order</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepIcon}>🚚</div>
                <h3>Fast Delivery</h3>
                <p>Get fresh delivery within 30 minutes</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Seasonal Produce */}
      <section className={styles.seasonal}>
        <h2>Seasonal Produce This Month</h2>
        <div className={styles.seasonalGrid}>
          {seasonalProduce.map((item) => (
            <div key={item.id} className={styles.seasonalItem}>
              <img src={item.imageUrl} alt={item.name} />
              <h3>{item.name}</h3>
              <p>Best {item.seasonMonths?.join(", ") || "this season"}</p>
            </div>
          ))}
        </div>
        <div className={styles.calendarLink}>
          <Link to="/seasonal-calendar">View Full Seasonal Calendar →</Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <h2>What Our Community Says</h2>
        <div className={styles.testimonialCarousel}>
          {testimonials.map((review) => (
            <div key={review.id} className={styles.testimonialCard}>
              <div className={styles.testimonialContent}>
                <p>"{review.comment?.substring(0, 150) || 'Great service!'}..."</p>
              </div>
              <div className={styles.reviewerInfo}>
                <img 
                  src={review.userPhoto || '/default-user.png'} 
                  alt={review.userName || 'User'} 
                  onError={(e) => e.target.src = '/default-user.png'}
                />
                <div>
                  <h4>{review.userName || 'Happy Customer'}</h4>
                  <div className={styles.rating}>
                    {"★".repeat(review.rating || 5)}
                    {"☆".repeat(5 - (review.rating || 5))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link to="/reviews" className={styles.allReviewsLink}>
          Read All Reviews
        </Link>
      </section> 

      {/* Community Spotlight */}
      <section className={styles.communitySpotlight}>
        <h2>Our Community</h2>
        <p className={styles.sectionSubtitle}>Connecting retailers and wholesalers nationwide</p>
        <div className={styles.userGrid}>
          {featuredUsers.length > 0 ? (
            featuredUsers.map(user => (
              <div key={user.id} className={styles.userCard}>
                {user.imageProfileUrl ? (
                  <img
                    src={user.imageProfileUrl}
                    alt={user.name}
                    className={styles.userImage}
                    onError={(e) => {
                      e.target.src = '/default-user.png';
                      e.target.className = `${styles.userImage} ${styles.fallbackImage}`;
                    }}
                  />
                ) : (
                  <div className={`${styles.userInitial} ${styles.fallbackImage}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3>{user.name}</h3>
                <p className={styles.userRole}>
                  {user.role === 'retailer' ? 'Verified Retailer' : 
                   user.role === 'wholesaler' ? 'Trusted Wholesaler' : 'Community Member'}
                </p>
              </div>
            ))
          ) : (
            <p className={styles.noUsers}>No community members to display</p>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className={styles.newsletter}>
        <div className={styles.newsletterContent}>
          <h2>Join Our Community</h2>
          <p>
            Get weekly recipes, seasonal produce updates, and exclusive offers
          </p>
          <form className={styles.newsletterForm}>
            <input
              type="email"
              placeholder="Your email address"
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Home;