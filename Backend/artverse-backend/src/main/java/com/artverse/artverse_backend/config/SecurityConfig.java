package com.artverse.artverse_backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Lazy
    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; "
                                        + "script-src 'self' https://accounts.google.com https://apis.google.com; "
                                        + "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                                        + "font-src 'self' https://fonts.gstatic.com data:; "
                                        + "img-src 'self' data: https:; "
                                        + "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com "
                                        + "https://rc-epay.esewa.com.np https://rc.esewa.com.np https://dev.khalti.com; "
                                        + "frame-src 'self' https://accounts.google.com; "
                                        + "form-action 'self' https://rc-epay.esewa.com.np; "
                                        + "frame-ancestors 'none'; "
                                        + "base-uri 'self'; "
                                        + "object-src 'none'"
                        ))
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/*.jpeg", "/*.jpg", "/*.png", "/*.webp", "/*.gif").permitAll()
                        .requestMatchers("/uploads/**").permitAll()

                        // ── "my"/protected sub-paths listed BEFORE the public wildcard ──
                        .requestMatchers(HttpMethod.GET, "/api/exhibitions/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/artworks/my").authenticated()

                        // ── Only artists may upload or edit artworks ──
                        .requestMatchers(HttpMethod.POST, "/api/artworks/upload").hasRole("ARTIST")
                        .requestMatchers(HttpMethod.PUT, "/api/artworks/**").hasRole("ARTIST")
                        .requestMatchers(HttpMethod.DELETE, "/api/artworks/**").hasRole("ARTIST")

                        // ── Public browsing: viewing is open ──
                        .requestMatchers(HttpMethod.GET, "/api/artworks/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/exhibitions/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/follows/**").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}