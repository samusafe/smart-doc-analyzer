package models

import "time"

type Collection struct {
	ID        int       `json:"id"`
	UserID    string    `json:"userId"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	Documents int       `json:"documents"`
}
