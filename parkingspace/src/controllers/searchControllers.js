import sequelize from "../config/db.js";

export const searchParking = async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ message: "Missing parameters" });
  }
  const query = `
    SELECT 
      p.id,
      p.name,
      p.price_per_hour,
      p.available_spots,
      l.latitude,
      l.longitude,
      (
        6371 * acos(
          cos(radians(:lat)) *
          cos(radians(l.latitude)) *
          cos(radians(l.longitude) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians(l.latitude))
        )
      ) AS distance
    FROM parking_spaces p
    JOIN parking_locations l ON p.id = l.parking_id
    WHERE p.available_spots > 0
    AND p.is_active = true
    HAVING distance < :radius
    ORDER BY distance;
  `;

  const results = await sequelize.query(query, {
    replacements: { lat, lng, radius },
    type: sequelize.QueryTypes.SELECT,
  });

  res.json(results);
};
