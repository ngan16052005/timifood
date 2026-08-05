package com.timifood.backend.repository;

import com.timifood.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // Tự động generate SQL tìm user theo số điện thoại (dùng cho đăng nhập)
    Optional<User> findByPhone(String phone);
}
